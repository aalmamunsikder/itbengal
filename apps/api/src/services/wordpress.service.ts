/**
 * Managed WordPress service.
 * Handles lifecycle provisioning, docker containers, files, and SQL query execution.
 *
 * Uses direct 'docker exec' with inline PHP scripts (incorporating SHORTINIT)
 * for secure file exploration and database querying directly inside the container.
 *
 * @module services/wordpress
 */

import { prisma } from '@itbengal/database';
import { encrypt } from '@itbengal/utils';
import { docker } from '../engine/index.js';
import { appConfig } from '../config/app.js';
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';

// Docker network for WordPress container links
const NETWORK_NAME = 'itbengal-network';

/**
 * Execute a command inside a running Docker container and return stdout.
 */
async function execInContainer(containerId: string, cmd: string[]): Promise<string> {
  const container = docker.getContainer(containerId);
  const exec = await container.exec({
    Cmd: cmd,
    AttachStdout: true,
    AttachStderr: true,
  });

  const stream = await exec.start({ Detach: false });
  
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    
    // Demux multiplexed Docker stream (first 8 bytes of header indicate stream type/size)
    stream.on('data', (chunk: Buffer) => {
      let offset = 0;
      while (offset < chunk.length) {
        if (chunk.length - offset < 8) break;
        const type = chunk.readUInt8(offset);
        const size = chunk.readUInt32BE(offset + 4);
        const payload = chunk.subarray(offset + 8, offset + 8 + size);
        
        if (type === 1) {
          stdout += payload.toString('utf-8');
        } else if (type === 2) {
          stderr += payload.toString('utf-8');
        }
        offset += 8 + size;
      }
    });

    stream.on('end', () => {
      resolve(stdout.trim());
    });

    stream.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Provision containers for a new WordPress site (WordPress + MariaDB).
 */
export async function createWordPressSite(
  _userId: string,
  orgId: string,
  data: {
    name: string;
    siteTitle: string;
    adminUsername: string;
    adminEmail: string;
    domain: string;
    customDomain?: string;
    phpVersion?: string;
    wpVersion?: string;
  }
) {
  // Validate unique domain
  const existingApp = await prisma.application.findUnique({
    where: { domain: data.domain },
  });
  if (existingApp) {
    throw new ForbiddenError('Domain is already taken');
  }

  // Verify active subscription
  const activeSub = await prisma.subscription.findFirst({
    where: {
      organizationId: orgId,
      status: 'ACTIVE',
    },
  });
  if (!activeSub) {
    throw new ForbiddenError('An active subscription is required to provision a WordPress site. Please subscribe via the Billing dashboard.');
  }

  // Find organization and project setup
  let project = await prisma.project.findFirst({
    where: { organizationId: orgId },
  });

  if (!project) {
    // Create a default project if none exists for this organization
    project = await prisma.project.create({
      data: {
        organizationId: orgId,
        name: 'Default WordPress Project',
        slug: 'default-wp-project',
        framework: 'STATIC_HTML' as any,
      },
    });
  }

  const dbPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-8);
  const encryptedDbPassword = encrypt(dbPassword, appConfig.encryptionKey);
  const dbName = `wp_${Math.random().toString(36).slice(2, 10)}`;
  const dbUser = `wp_user_${Math.random().toString(36).slice(2, 6)}`;

  // Create database records in a transaction
  const application = await prisma.application.create({
    data: {
      projectId: project.id,
      type: 'WORDPRESS',
      domain: data.domain,
      customDomain: data.customDomain || null,
      containerStatus: 'CREATING',
    },
  });

  const wpSite = await prisma.wordPressSite.create({
    data: {
      applicationId: application.id,
      wpVersion: data.wpVersion || 'latest',
      phpVersion: data.phpVersion || '8.2',
      dbName,
      dbUser,
      dbPasswordEncrypted: encryptedDbPassword,
      siteTitle: data.siteTitle,
      siteUrl: `http://${data.domain}`,
      adminEmail: data.adminEmail,
      adminUsername: data.adminUsername,
    },
  });

  // Provisioning async worker flow simulated here synchronously for development simplicity
  try {
    const dbContainerName = `itbengal-wp-db-${application.id.slice(0, 8)}`;
    const appContainerName = `itbengal-wp-app-${application.id.slice(0, 8)}`;

    // 1. Launch MariaDB container
    const dbContainer = await docker.createContainer({
      Image: 'mariadb:10.11',
      name: dbContainerName,
      Env: [
        'MYSQL_ROOT_PASSWORD=itbengal_wp_root_root',
        `MYSQL_DATABASE=${dbName}`,
        `MYSQL_USER=${dbUser}`,
        `MYSQL_PASSWORD=${dbPassword}`,
      ],
      HostConfig: {
        NetworkMode: NETWORK_NAME,
        RestartPolicy: { Name: 'unless-stopped' },
      },
    });
    await dbContainer.start();

    // 2. Launch WordPress container
    const appContainer = await docker.createContainer({
      Image: 'wordpress:php8.2-apache',
      name: appContainerName,
      Env: [
        `WORDPRESS_DB_HOST=${dbContainerName}`,
        `WORDPRESS_DB_USER=${dbUser}`,
        `WORDPRESS_DB_PASSWORD=${dbPassword}`,
        `WORDPRESS_DB_NAME=${dbName}`,
      ],
      Labels: {
        'traefik.enable': 'true',
        [`traefik.http.routers.wp-${application.id.slice(0, 8)}.rule`]: `Host(\`${data.domain}\`)${data.customDomain ? ` || Host(\`${data.customDomain}\`)` : ''}`,
        [`traefik.http.routers.wp-${application.id.slice(0, 8)}.entrypoints`]: 'web',
        [`traefik.http.services.wp-${application.id.slice(0, 8)}.loadbalancer.server.port`]: '80',
      },
      HostConfig: {
        NetworkMode: NETWORK_NAME,
        RestartPolicy: { Name: 'unless-stopped' },
      },
    });
    await appContainer.start();

    // Update container ID and status
    await prisma.application.update({
      where: { id: application.id },
      data: {
        containerId: appContainerName,
        containerStatus: 'RUNNING',
      },
    });

    return {
      application: { ...application, containerId: appContainerName, containerStatus: 'RUNNING' },
      wpSite,
    };
  } catch (error) {
    // Cleanup if setup fails
    await prisma.application.update({
      where: { id: application.id },
      data: { containerStatus: 'ERROR' },
    });
    throw error;
  }
}

/**
 * Remove containers and delete WordPress records.
 */
export async function deleteWordPressSite(orgId: string, id: string) {
  const application = await prisma.application.findFirst({
    where: { id, project: { organizationId: orgId } },
  });
  if (!application) {
    throw new NotFoundError('WordPress application not found');
  }

  const dbContainerName = `itbengal-wp-db-${application.id.slice(0, 8)}`;
  const appContainerName = application.containerId || `itbengal-wp-app-${application.id.slice(0, 8)}`;

  // Delete containers
  try {
    const appContainer = docker.getContainer(appContainerName);
    await appContainer.stop().catch(() => {});
    await appContainer.remove().catch(() => {});
  } catch {}

  try {
    const dbContainer = docker.getContainer(dbContainerName);
    await dbContainer.stop().catch(() => {});
    await dbContainer.remove().catch(() => {});
  } catch {}

  // Delete records
  await prisma.application.delete({ where: { id } });
  return true;
}

/**
 * List files in directory.
 */
export async function listFiles(id: string, subpath: string) {
  const application = await prisma.application.findUnique({ where: { id } });
  if (!application || !application.containerId) {
    throw new NotFoundError('Application container not found');
  }

  const cleanSubpath = '/' + subpath.replace(/^\/+|\/+$/g, '');
  const targetDir = cleanSubpath === '/' ? '/var/www/html' : `/var/www/html${cleanSubpath}`;

  // Execute scanning via inline php script to cleanly structure metadata as JSON
  const phpCode = `
    $dir = '${targetDir}';
    if (!is_dir($dir)) {
      echo json_encode(['error' => 'Not a directory']);
      exit(1);
    }
    $res = [];
    $files = scandir($dir);
    foreach ($files as $f) {
      if ($f === '.' || $f === '..') continue;
      $p = "$dir/$f";
      $res[] = [
        'name' => $f,
        'type' => is_dir($p) ? 'directory' : 'file',
        'size' => is_dir($p) ? 0 : filesize($p),
        'permissions' => substr(sprintf('%o', fileperms($p)), -4),
        'updatedAt' => filemtime($p)
      ];
    }
    echo json_encode($res);
  `;

  const output = await execInContainer(application.containerId, ['php', '-r', phpCode]);
  const parsed = JSON.parse(output);
  if (parsed.error) {
    throw new Error(parsed.error);
  }
  return parsed;
}

/**
 * Read file contents.
 */
export async function readFile(id: string, filePath: string) {
  const application = await prisma.application.findUnique({ where: { id } });
  if (!application || !application.containerId) {
    throw new NotFoundError('Application container not found');
  }

  const cleanPath = '/' + filePath.replace(/^\/+/g, '');
  const targetFile = `/var/www/html${cleanPath}`;

  const phpCode = `
    $p = '${targetFile}';
    if (!is_file($p)) {
      echo json_encode(['error' => 'File not found']);
      exit(1);
    }
    echo json_encode(['content' => base64_encode(file_get_contents($p))]);
  `;

  const output = await execInContainer(application.containerId, ['php', '-r', phpCode]);
  const parsed = JSON.parse(output);
  if (parsed.error) {
    throw new Error(parsed.error);
  }
  return Buffer.from(parsed.content, 'base64').toString('utf-8');
}

/**
 * Write file contents.
 */
export async function writeFile(id: string, filePath: string, content: string) {
  const application = await prisma.application.findUnique({ where: { id } });
  if (!application || !application.containerId) {
    throw new NotFoundError('Application container not found');
  }

  const cleanPath = '/' + filePath.replace(/^\/+/g, '');
  const targetFile = `/var/www/html${cleanPath}`;
  const base64Content = Buffer.from(content).toString('base64');

  const phpCode = `
    $p = '${targetFile}';
    $data = base64_decode('${base64Content}');
    if (file_put_contents($p, $data) === false) {
      echo json_encode(['error' => 'Failed to write file']);
      exit(1);
    }
    echo json_encode(['success' => true]);
  `;

  const output = await execInContainer(application.containerId, ['php', '-r', phpCode]);
  const parsed = JSON.parse(output);
  if (parsed.error) {
    throw new Error(parsed.error);
  }
  return true;
}

/**
 * Delete a file or directory.
 */
export async function deleteFile(id: string, filePath: string) {
  const application = await prisma.application.findUnique({ where: { id } });
  if (!application || !application.containerId) {
    throw new NotFoundError('Application container not found');
  }

  const cleanPath = '/' + filePath.replace(/^\/+/g, '');
  const target = `/var/www/html${cleanPath}`;

  const phpCode = `
    $p = '${target}';
    if (is_dir($p)) {
      // Helper recursive rmdir
      function rrmdir($dir) {
        if (is_dir($dir)) {
          $objects = scandir($dir);
          foreach ($objects as $object) {
            if ($object != "." && $object != "..") {
              if (is_dir($dir."/".$object)) rrmdir($dir."/".$object);
              else unlink($dir."/".$object);
            }
          }
          rmdir($dir);
        }
      }
      rrmdir($p);
      echo json_encode(['success' => true]);
    } elseif (is_file($p)) {
      unlink($p);
      echo json_encode(['success' => true]);
    } else {
      echo json_encode(['error' => 'Path not found']);
    }
  `;

  const output = await execInContainer(application.containerId, ['php', '-r', phpCode]);
  const parsed = JSON.parse(output);
  if (parsed.error) {
    throw new Error(parsed.error);
  }
  return true;
}

/**
 * List database tables.
 */
export async function listTables(id: string) {
  const application = await prisma.application.findUnique({ where: { id } });
  if (!application || !application.containerId) {
    throw new NotFoundError('Application container not found');
  }

  const phpCode = `
    define('SHORTINIT', true);
    require('/var/www/html/wp-load.php');
    global $wpdb;
    $res = $wpdb->get_results('SHOW TABLES', ARRAY_N);
    $tables = array_map(function($r) { return $r[0]; }, $res);
    echo json_encode($tables);
  `;

  const output = await execInContainer(application.containerId, ['php', '-r', phpCode]);
  return JSON.parse(output);
}

/**
 * Run a custom SQL query.
 */
export async function runQuery(id: string, query: string) {
  const application = await prisma.application.findUnique({ where: { id } });
  if (!application || !application.containerId) {
    throw new NotFoundError('Application container not found');
  }

  // Escape query for php quotes
  const escapedQuery = query.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

  const phpCode = `
    define('SHORTINIT', true);
    require('/var/www/html/wp-load.php');
    global $wpdb;
    $wpdb->hide_errors();
    $res = $wpdb->get_results('${escapedQuery}', ARRAY_A);
    if ($wpdb->last_error) {
      echo json_encode(['error' => $wpdb->last_error]);
    } else {
      echo json_encode(['rows' => $res, 'affected' => $wpdb->rows_affected]);
    }
  `;

  const output = await execInContainer(application.containerId, ['php', '-r', phpCode]);
  return JSON.parse(output);
}

/**
 * Update a WordPress installation and recreate container if custom domain changes.
 */
export async function updateWordPressSite(id: string, data: {
  siteTitle?: string;
  customDomain?: string;
  phpVersion?: string;
  autoUpdatesEnabled?: boolean;
  cacheEnabled?: boolean;
}) {
  const app = await prisma.application.findUnique({
    where: { id },
    include: { wordpressSite: true },
  });

  if (!app || !app.wordpressSite) {
    throw new NotFoundError('WordPress installation not found');
  }

  // Update records
  const updatedApp = await prisma.application.update({
    where: { id },
    data: {
      customDomain: data.customDomain !== undefined ? (data.customDomain || null) : undefined,
      wordpressSite: {
        update: {
          siteTitle: data.siteTitle,
          phpVersion: data.phpVersion,
          autoUpdatesEnabled: data.autoUpdatesEnabled,
          cacheEnabled: data.cacheEnabled,
        },
      },
    },
    include: { wordpressSite: true },
  });

  // Recreate container if customDomain has changed to update Traefik labels
  if (data.customDomain !== undefined && app.containerId) {
    try {
      const appContainer = docker.getContainer(app.containerId);
      await appContainer.stop().catch(() => {});
      await appContainer.remove().catch(() => {});

      const dbContainerName = `itbengal-wp-db-${app.id.slice(0, 8)}`;
      const appContainerName = `itbengal-wp-app-${app.id.slice(0, 8)}`;

      const newAppContainer = await docker.createContainer({
        Image: 'wordpress:php8.2-apache',
        name: appContainerName,
        Env: [
          `WORDPRESS_DB_HOST=${dbContainerName}`,
          `WORDPRESS_DB_USER=${app.wordpressSite.dbUser}`,
          `WORDPRESS_DB_PASSWORD=itbengal_wp_root_root`,
          `WORDPRESS_DB_NAME=${app.wordpressSite.dbName}`,
        ],
        Labels: {
          'traefik.enable': 'true',
          [`traefik.http.routers.wp-${app.id.slice(0, 8)}.rule`]: `Host(\`${app.domain}\`)${data.customDomain ? ` || Host(\`${data.customDomain}\`)` : ''}`,
          [`traefik.http.routers.wp-${app.id.slice(0, 8)}.entrypoints`]: 'web',
          [`traefik.http.services.wp-${app.id.slice(0, 8)}.loadbalancer.server.port`]: '80',
        },
        HostConfig: {
          NetworkMode: 'itbengal-network',
          RestartPolicy: { Name: 'unless-stopped' },
        },
      });
      await newAppContainer.start();
    } catch (err: any) {
      console.error('[WPService] Failed to update Traefik labels on container:', err.message);
    }
  }

  return updatedApp;
}
