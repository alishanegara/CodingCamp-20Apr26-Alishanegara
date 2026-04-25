import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

// Load the app.js file
const appJs = fs.readFileSync(path.resolve(__dirname, '../js/app.js'), 'utf-8');

// Create a new JSDOM instance with localStorage
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  runScripts: 'dangerously'
});

global.window = dom.window;
global.document = dom.window.document;
global.localStorage = dom.window.localStorage;

// Execute the app.js code to get modules
const script = dom.window.document.createElement('script');
script.textContent = appJs;
dom.window.document.body.appendChild(script);

const LinksModule = dom.window.LinksModule;
const StorageModule = dom.window.StorageModule;

describe('LinksModule', () => {
  let container;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    // Create a fresh container for each test
    container = document.createElement('div');
    container.className = 'links-container';
    container.innerHTML = `
      <form class="links-form">
        <input type="text" class="link-name-input" placeholder="Name">
        <input type="url" class="link-url-input" placeholder="URL">
        <button type="submit" class="btn-add-link">Add Link</button>
      </form>
      <div class="links-list">
      </div>
      <div class="links-empty" hidden>No quick links yet. Add one above!</div>
    `;
    document.body.appendChild(container);
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = LinksModule.generateId();
      const id2 = LinksModule.generateId();
      
      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it('should generate IDs with timestamp and random parts', () => {
      const id = LinksModule.generateId();
      
      expect(id).toMatch(/^\d+-[a-z0-9]+$/);
    });
  });

  describe('normalizeUrl', () => {
    it('should add https:// to URLs without protocol', () => {
      expect(LinksModule.normalizeUrl('example.com')).toBe('https://example.com');
      expect(LinksModule.normalizeUrl('www.example.com')).toBe('https://www.example.com');
    });

    it('should preserve existing https:// protocol', () => {
      expect(LinksModule.normalizeUrl('https://example.com')).toBe('https://example.com');
    });

    it('should preserve existing http:// protocol', () => {
      expect(LinksModule.normalizeUrl('http://example.com')).toBe('http://example.com');
    });

    it('should handle URLs with paths', () => {
      expect(LinksModule.normalizeUrl('example.com/path/to/page')).toBe('https://example.com/path/to/page');
    });

    it('should return null for invalid URLs', () => {
      expect(LinksModule.normalizeUrl('not a url')).toBe(null);
      expect(LinksModule.normalizeUrl('ht!tp://invalid')).toBe(null);
    });

    it('should trim whitespace', () => {
      expect(LinksModule.normalizeUrl('  example.com  ')).toBe('https://example.com');
    });

    it('should handle URLs with query parameters', () => {
      expect(LinksModule.normalizeUrl('example.com?param=value')).toBe('https://example.com/?param=value');
    });

    it('should handle URLs with fragments', () => {
      expect(LinksModule.normalizeUrl('example.com#section')).toBe('https://example.com/#section');
    });
  });

  describe('validateLink', () => {
    it('should accept valid name and URL', () => {
      expect(LinksModule.validateLink('GitHub', 'github.com')).toBe(true);
      expect(LinksModule.validateLink('Google', 'https://google.com')).toBe(true);
    });

    it('should reject empty name', () => {
      expect(LinksModule.validateLink('', 'example.com')).toBe(false);
    });

    it('should reject whitespace-only name', () => {
      expect(LinksModule.validateLink('   ', 'example.com')).toBe(false);
    });

    it('should reject name exceeding 50 characters', () => {
      const longName = 'a'.repeat(51);
      expect(LinksModule.validateLink(longName, 'example.com')).toBe(false);
    });

    it('should accept name at exactly 50 characters', () => {
      const maxName = 'a'.repeat(50);
      expect(LinksModule.validateLink(maxName, 'example.com')).toBe(true);
    });

    it('should reject invalid URL', () => {
      expect(LinksModule.validateLink('Valid Name', 'not a url')).toBe(false);
    });

    it('should trim name before validation', () => {
      expect(LinksModule.validateLink('  Valid  ', 'example.com')).toBe(true);
    });
  });

  describe('init', () => {
    it('should initialize without errors', () => {
      expect(() => {
        LinksModule.init(container);
      }).not.toThrow();
    });

    it('should handle missing container gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      LinksModule.init(null);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('LinksModule: Container element not found');
      consoleErrorSpy.mockRestore();
    });

    it('should show empty state when no links exist', () => {
      LinksModule.init(container);
      
      const emptyElement = container.querySelector('.links-empty');
      expect(emptyElement.hidden).toBe(true);
    });
  });

  describe('addLink', () => {
    beforeEach(() => {
      LinksModule.init(container);
    });

    it('should add a valid link', () => {
      const result = LinksModule.addLink('GitHub', 'github.com');
      
      expect(result).toBe(true);
      
      const links = StorageModule.load('dashboard_links');
      expect(links).toHaveLength(1);
      expect(links[0].name).toBe('GitHub');
      expect(links[0].url).toBe('https://github.com');
      expect(links[0].id).toBeTruthy();
    });

    it('should normalize URL when adding', () => {
      LinksModule.addLink('Example', 'example.com');
      
      const links = StorageModule.load('dashboard_links');
      expect(links[0].url).toBe('https://example.com');
    });

    it('should trim link name before adding', () => {
      LinksModule.addLink('  Trimmed  ', 'example.com');
      
      const links = StorageModule.load('dashboard_links');
      expect(links[0].name).toBe('Trimmed');
    });

    it('should reject empty link name', () => {
      const result = LinksModule.addLink('', 'example.com');
      
      expect(result).toBe(false);
      
      const links = StorageModule.load('dashboard_links');
      expect(links).toBe(null);
    });

    it('should reject whitespace-only link name', () => {
      const result = LinksModule.addLink('   ', 'example.com');
      
      expect(result).toBe(false);
    });

    it('should reject link name exceeding 50 characters', () => {
      const longName = 'a'.repeat(51);
      const result = LinksModule.addLink(longName, 'example.com');
      
      expect(result).toBe(false);
    });

    it('should reject invalid URL', () => {
      const result = LinksModule.addLink('Valid Name', 'not a url');
      
      expect(result).toBe(false);
    });

    it('should render the link in the DOM', () => {
      LinksModule.addLink('Visible Link', 'example.com');
      
      const linksList = container.querySelector('.links-list');
      const linkItems = linksList.querySelectorAll('.link-item');
      
      expect(linkItems).toHaveLength(1);
      expect(linkItems[0].querySelector('.link-button').textContent).toBe('Visible Link');
    });

    it('should hide empty state after adding first link', () => {
      LinksModule.addLink('First Link', 'example.com');
      
      const emptyElement = container.querySelector('.links-empty');
      expect(emptyElement.hidden).toBe(true);
    });

    it('should add multiple links', () => {
      LinksModule.addLink('Link 1', 'example1.com');
      LinksModule.addLink('Link 2', 'example2.com');
      LinksModule.addLink('Link 3', 'example3.com');
      
      const links = StorageModule.load('dashboard_links');
      expect(links).toHaveLength(3);
      
      const linksList = container.querySelector('.links-list');
      const linkItems = linksList.querySelectorAll('.link-item');
      expect(linkItems).toHaveLength(3);
    });

    it('should set correct attributes on link element', () => {
      LinksModule.addLink('Test Link', 'https://example.com');
      
      const linkButton = container.querySelector('.link-button');
      expect(linkButton.href).toBe('https://example.com/');
      expect(linkButton.target).toBe('_blank');
      expect(linkButton.rel).toBe('noopener noreferrer');
    });
  });

  describe('deleteLink', () => {
    beforeEach(() => {
      LinksModule.init(container);
    });

    it('should delete a link', () => {
      LinksModule.addLink('Link to delete', 'example.com');
      const links = StorageModule.load('dashboard_links');
      const linkId = links[0].id;
      
      LinksModule.deleteLink(linkId);
      
      const updatedLinks = StorageModule.load('dashboard_links');
      expect(updatedLinks).toHaveLength(0);
    });

    it('should remove link from DOM', () => {
      LinksModule.addLink('Link to remove', 'example.com');
      const links = StorageModule.load('dashboard_links');
      const linkId = links[0].id;
      
      LinksModule.deleteLink(linkId);
      
      const linksList = container.querySelector('.links-list');
      const linkItems = linksList.querySelectorAll('.link-item');
      expect(linkItems).toHaveLength(0);
    });

    it('should show empty state after deleting last link', () => {
      LinksModule.addLink('Only link', 'example.com');
      const links = StorageModule.load('dashboard_links');
      const linkId = links[0].id;
      
      LinksModule.deleteLink(linkId);
      
      const emptyElement = container.querySelector('.links-empty');
      expect(emptyElement.hidden).toBe(false);
    });

    it('should delete only the specified link', () => {
      LinksModule.addLink('Link 1', 'example1.com');
      LinksModule.addLink('Link 2', 'example2.com');
      LinksModule.addLink('Link 3', 'example3.com');
      
      const links = StorageModule.load('dashboard_links');
      const linkIdToDelete = links[1].id;
      
      LinksModule.deleteLink(linkIdToDelete);
      
      const updatedLinks = StorageModule.load('dashboard_links');
      expect(updatedLinks).toHaveLength(2);
      expect(updatedLinks.find(l => l.id === linkIdToDelete)).toBeUndefined();
    });

    it('should handle deleting nonexistent link gracefully', () => {
      LinksModule.addLink('Link 1', 'example.com');
      
      expect(() => {
        LinksModule.deleteLink('nonexistent-id');
      }).not.toThrow();
      
      const links = StorageModule.load('dashboard_links');
      expect(links).toHaveLength(1);
    });
  });

  describe('loadLinks', () => {
    beforeEach(() => {
      LinksModule.init(container);
    });

    it('should load links from storage', () => {
      const savedLinks = [
        { id: '1', name: 'Link 1', url: 'https://example1.com' },
        { id: '2', name: 'Link 2', url: 'https://example2.com' }
      ];
      
      StorageModule.save('dashboard_links', savedLinks);
      
      LinksModule.loadLinks();
      
      const linksList = container.querySelector('.links-list');
      const linkItems = linksList.querySelectorAll('.link-item');
      
      expect(linkItems).toHaveLength(2);
    });

    it('should handle missing storage data', () => {
      expect(() => {
        LinksModule.loadLinks();
      }).not.toThrow();
      
      const linksList = container.querySelector('.links-list');
      const linkItems = linksList.querySelectorAll('.link-item');
      
      expect(linkItems).toHaveLength(0);
    });

    it('should handle corrupted storage data', () => {
      localStorage.setItem('dashboard_links', 'invalid json {]');
      
      expect(() => {
        LinksModule.loadLinks();
      }).not.toThrow();
      
      const linksList = container.querySelector('.links-list');
      const linkItems = linksList.querySelectorAll('.link-item');
      
      expect(linkItems).toHaveLength(0);
    });

    it('should handle non-array storage data', () => {
      StorageModule.save('dashboard_links', { not: 'an array' });
      
      expect(() => {
        LinksModule.loadLinks();
      }).not.toThrow();
      
      const linksList = container.querySelector('.links-list');
      const linkItems = linksList.querySelectorAll('.link-item');
      
      expect(linkItems).toHaveLength(0);
    });
  });

  describe('form submission', () => {
    beforeEach(() => {
      LinksModule.init(container);
    });

    it('should add link on form submission', () => {
      const form = container.querySelector('.links-form');
      const nameInput = container.querySelector('.link-name-input');
      const urlInput = container.querySelector('.link-url-input');
      
      nameInput.value = 'GitHub';
      urlInput.value = 'github.com';
      
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);
      
      const links = StorageModule.load('dashboard_links');
      expect(links).toHaveLength(1);
      expect(links[0].name).toBe('GitHub');
      expect(links[0].url).toBe('https://github.com');
    });

    it('should clear inputs after successful submission', () => {
      const form = container.querySelector('.links-form');
      const nameInput = container.querySelector('.link-name-input');
      const urlInput = container.querySelector('.link-url-input');
      
      nameInput.value = 'Example';
      urlInput.value = 'example.com';
      
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);
      
      expect(nameInput.value).toBe('');
      expect(urlInput.value).toBe('');
    });

    it('should not clear inputs after failed submission', () => {
      const form = container.querySelector('.links-form');
      const nameInput = container.querySelector('.link-name-input');
      const urlInput = container.querySelector('.link-url-input');
      
      nameInput.value = '   '; // Invalid (whitespace only)
      urlInput.value = 'example.com';
      
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);
      
      expect(nameInput.value).toBe('   ');
      expect(urlInput.value).toBe('example.com');
    });

    it('should prevent default form submission', () => {
      const form = container.querySelector('.links-form');
      const nameInput = container.querySelector('.link-name-input');
      const urlInput = container.querySelector('.link-url-input');
      
      nameInput.value = 'Test';
      urlInput.value = 'example.com';
      
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(submitEvent, 'preventDefault');
      
      form.dispatchEvent(submitEvent);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('link click handling', () => {
    beforeEach(() => {
      LinksModule.init(container);
      // Mock window.open
      global.window.open = vi.fn();
    });

    it('should open link in new tab with security attributes', () => {
      LinksModule.addLink('Test Link', 'https://example.com');
      
      const linkButton = container.querySelector('.link-button');
      const clickEvent = new Event('click', { bubbles: true, cancelable: true });
      linkButton.dispatchEvent(clickEvent);
      
      expect(window.open).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
    });

    it('should prevent default link behavior', () => {
      LinksModule.addLink('Test Link', 'https://example.com');
      
      const linkButton = container.querySelector('.link-button');
      const clickEvent = new Event('click', { bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
      
      linkButton.dispatchEvent(clickEvent);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('integration scenarios', () => {
    beforeEach(() => {
      LinksModule.init(container);
    });

    it('should handle complete workflow: add and delete', () => {
      // Add
      LinksModule.addLink('Test Link', 'example.com');
      let links = StorageModule.load('dashboard_links');
      expect(links).toHaveLength(1);
      const linkId = links[0].id;
      
      // Delete
      LinksModule.deleteLink(linkId);
      links = StorageModule.load('dashboard_links');
      expect(links).toHaveLength(0);
    });

    it('should maintain link order', () => {
      LinksModule.addLink('First', 'first.com');
      LinksModule.addLink('Second', 'second.com');
      LinksModule.addLink('Third', 'third.com');
      
      const links = StorageModule.load('dashboard_links');
      expect(links[0].name).toBe('First');
      expect(links[1].name).toBe('Second');
      expect(links[2].name).toBe('Third');
    });

    it('should persist links across module reinitialization', () => {
      LinksModule.addLink('Persistent Link', 'example.com');
      
      // Reinitialize
      const newContainer = document.createElement('div');
      newContainer.className = 'links-container';
      newContainer.innerHTML = container.innerHTML;
      document.body.appendChild(newContainer);
      
      LinksModule.init(newContainer);
      LinksModule.loadLinks();
      
      const linksList = newContainer.querySelector('.links-list');
      const linkItems = linksList.querySelectorAll('.link-item');
      
      expect(linkItems).toHaveLength(1);
      expect(linkItems[0].querySelector('.link-button').textContent).toBe('Persistent Link');
    });
  });
});
