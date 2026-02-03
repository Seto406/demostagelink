import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Email Templates Static Analysis', () => {
  const templatesDir = path.join(process.cwd(), 'supabase', 'email_templates');
  const templateFiles = [
    'confirm_signup.html',
    'invite_user.html',
    'magic_link.html',
    'reset_password.html'
  ];

  for (const file of templateFiles) {
    test(`Template ${file} contains critical placeholders`, async () => {
      const filePath = path.join(templatesDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      // Check for Confirmation URL
      expect(content).toContain('{{ .ConfirmationURL }}');

      // Check for Site URL (branding)
      expect(content).toContain('{{ .SiteURL }}');

      // Check for curtain background
      expect(content).toContain('bg_curtains.png');

      // Check for First Name usage (warning if not present, but here we expect it)
      expect(content).toContain('{{ .Data.first_name }}');
    });
  }

  test('send-show-reminder function has correct email structure', async () => {
      const funcPath = path.join(process.cwd(), 'supabase', 'functions', 'send-show-reminder', 'index.ts');
      const content = fs.readFileSync(funcPath, 'utf-8');

      // Check subject
      expect(content).toContain('subject: `Reminder: "${show.title}" is starting soon!`');

      // Check body
      expect(content).toContain('Your Show is Coming Up!');
      expect(content).toContain('hello@stagelink.show');
  });
});
