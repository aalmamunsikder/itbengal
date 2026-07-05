# Hosting Platform - Complete Production Documentation Prompt

## Role

You are a team consisting of:

* Senior Product Manager
* Senior Software Architect
* Senior DevOps Engineer
* Senior Cloud Architect
* Senior Security Engineer
* Senior UI/UX Designer
* Senior Database Architect
* Senior Technical Writer

Your task is to produce COMPLETE production-ready documentation.

Do NOT generate application code.

Everything must be written in professional Markdown.

The documentation must be detailed enough that an engineering team can build the entire platform without asking further questions.

Assume this documentation will become the company's official engineering specification.

---

# Project Vision

Build a modern hosting platform that combines the simplicity of Vercel, Netlify, Hostinger and Cloudways.

The company will launch in Bangladesh and later expand internationally.

The platform should provide a premium customer experience with a beautiful modern interface while remaining extremely scalable.

---

# Infrastructure Philosophy

The platform will NOT use AWS, Azure, Google Cloud or any serverless architecture.

Everything will run on self-managed VPS infrastructure.

The architecture must be designed for horizontal scaling.

New VPS servers should be added without changing the customer experience.

---

# Initial Infrastructure

## Platform Server

Purpose

Platform Management

Runs

* Next.js Dashboard
* Express.js API
* PostgreSQL
* Redis
* Authentication
* Billing
* Notifications
* Admin Dashboard
* Customer Dashboard
* Domain Management
* DNS Management
* Openprovider API Integration
* Monitoring
* Background Workers

---

## React Hosting Server

Purpose

Modern Application Hosting

Supports

* React
* Next.js
* Vite
* Vue
* Angular
* Svelte
* Astro
* Static HTML

Responsibilities

* Git Deployments
* ZIP Uploads
* Docker Containers
* Automatic Build
* Automatic Deployment
* Automatic SSL
* Custom Domains
* Environment Variables
* Build Logs
* Deployment Logs
* Rollbacks
* Preview Deployments (Future)

---

## WordPress Hosting Server

Purpose

Managed WordPress Hosting

Responsibilities

* WordPress Installation
* PHP
* MariaDB/MySQL
* Automatic SSL
* Automatic Backups
* Staging
* Clone Website
* File Manager
* Database Manager
* Performance Optimization
* Malware Scanning
* Automatic Updates

---

# Future Scaling

The documentation must explain how to scale to thousands of customers.

Future infrastructure:

Platform Server

React Node 1

React Node 2

React Node 3

WordPress Node 1

WordPress Node 2

WordPress Node 3

Dedicated Database Server

Dedicated Redis Server

Dedicated Monitoring Server

Backup Server

Object Storage Server

Deployment Worker Nodes

The documentation must explain:

Node Registration

Node Discovery

Health Checks

Automatic Server Selection

Scheduling

Load Distribution

Automatic Failover

Backup Strategy

Migration Strategy

Disaster Recovery

---

# Domain Provider

Use Openprovider.

Design complete architecture for:

Authentication

API Wrapper

Availability Search

Registration

Transfers

Renewals

Nameservers

DNS Records

WHOIS Privacy

Synchronization

Retries

Error Handling

Background Jobs

Caching

Webhook Processing

---

# Hosting Products

## React Hosting

Support

React

Next.js

Vue

Angular

Svelte

Astro

HTML

Vite

Features

GitHub Integration

GitLab Integration

Bitbucket Integration

ZIP Upload

Automatic Builds

Automatic Deployments

SSL

Custom Domains

Deployment Logs

Rollback

Environment Variables

Application Restart

Usage Analytics

---

## WordPress Hosting

One-click Install

Automatic SSL

Automatic Backup

Restore Backup

Clone Website

File Manager

Database Manager

Automatic Updates

Caching

Security Hardening

Malware Scan

Staging

---

# Customer Dashboard

Design every screen.

Include

Dashboard

Projects

React Apps

WordPress Sites

Domains

DNS

SSL

Billing

Invoices

Subscriptions

Usage

Deployment Logs

Backups

Support

Notifications

Profile

API Keys

Organizations

Teams

Security

Settings

---

# Admin Dashboard

Create a complete administration portal.

Include

Customer Management

Orders

Payments

Domains

Hosting

Deployments

React Servers

WordPress Servers

Server Health

Monitoring

Analytics

Support Tickets

Coupons

Pricing

Announcements

Audit Logs

Security

System Settings

---

# Payment System

Bangladesh

* bKash
* Nagad
* Rocket

International

* Stripe
* PayPal

Support

Subscriptions

Invoices

Taxes

Refunds

Discounts

Promo Codes

Renewals

Automatic Billing

---

# Pricing System

Support multiple plans.

React Hosting

Starter

Basic

Professional

Business

Enterprise

WordPress Hosting

Starter

Basic

Professional

Business

Enterprise

Each plan should define

CPU

RAM

Storage

Bandwidth

Projects

Domains

Backups

Build Minutes

Deployments

Team Members

Priority Queue

SSL

Logs

Support Level

---

# Security

Create complete security documentation.

Authentication

Authorization

RBAC

JWT

Sessions

2FA

Rate Limiting

CSRF

XSS Protection

SQL Injection Protection

Container Isolation

Secrets Management

Encryption

Firewall

Audit Logs

Backup Encryption

Password Policies

Security Headers

Incident Response

---

# Database

Design complete PostgreSQL schema.

Include

Users

Organizations

Teams

Projects

Deployments

Applications

Domains

DNS Records

Servers

Server Nodes

Plans

Subscriptions

Invoices

Payments

Orders

Notifications

Support Tickets

Audit Logs

Backups

API Keys

Everything required.

Include relationships and ER diagrams.

---

# API

Design production REST APIs.

Include

Authentication

Users

Projects

Applications

Deployments

Domains

DNS

Hosting

WordPress

Billing

Payments

Servers

Admin

Notifications

Support

Include

Request Models

Response Models

Validation

Error Codes

Pagination

Filtering

Sorting

Rate Limits

Webhooks

---

# Deployment Engine

Design a custom deployment engine.

Include

Git Clone

ZIP Upload

Docker Build

Container Creation

Reverse Proxy

Traefik Routing

SSL Generation

Health Checks

Logs

Restart

Rollback

Node Selection

Deployment Queue

Scheduling

Resource Allocation

---

# Technology Stack

Frontend

Next.js

React

TypeScript

Tailwind CSS

Backend

Express.js

Node.js

Database

PostgreSQL

Redis

Infrastructure

Ubuntu Server

Docker

Docker Compose

Traefik

Nginx

Let's Encrypt

Monitoring

Prometheus

Grafana

Loki

Git

BullMQ

---

# UI/UX

Design a premium interface inspired by

Vercel

Hostinger

Cloudflare

Linear

GitHub

Notion

Requirements

Minimal

Fast

Modern

Beautiful

Professional

Responsive

Dark Mode

Light Mode

Accessibility

Micro Animations

---

# Documentation Required

Generate ALL documentation.

Include

Product Requirements Document (PRD)

Software Requirements Specification (SRS)

System Architecture

Infrastructure Design

Deployment Architecture

Database Design

API Documentation

UI/UX Specification

Security Specification

DevOps Guide

Deployment Guide

Operations Manual

Monitoring Guide

Disaster Recovery Plan

Testing Strategy

Quality Assurance Plan

Coding Standards

Repository Structure

Folder Structure

Naming Conventions

Environment Variables

Acceptance Criteria

Roadmap

Milestones

Risk Analysis

Scalability Strategy

Cost Optimization Strategy

Maintenance Plan

Future Expansion Plan

---

# Output Requirements

Produce documentation only.

Do not generate application source code.

Use professional Markdown.

Use Mermaid diagrams for architecture, workflows, and ERDs.

Use tables where appropriate.

Every decision should be explained.

Assume this documentation will guide the development of a commercial-grade hosting platform from MVP to enterprise scale while remaining based entirely on self-managed VPS infrastructure.
