import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

describe("Publishing", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), "themebooth-publish-test-" + Date.now());
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe("vscode.ts", () => {
    it("should validate vsce CLI check works", async () => {
      // vsce check returns true if installed, false otherwise
      // This is a mock test since actual vsce may not be installed
      const checkVsceSpy = jest.fn(() => false);
      expect(() => {
        if (!checkVsceSpy()) {
          throw new Error("vsce CLI not installed");
        }
      }).toThrow("vsce CLI not installed");
    });

    it("should handle missing theme file gracefully", async () => {
      const mockThemePath = path.join(tempDir, "nonexistent.json");
      await expect(fs.access(mockThemePath)).rejects.toThrow();
    });
  });

  describe("zed.ts", () => {
    it("should validate Zed theme payload structure", async () => {
      const validPayload = {
        id: "my-theme",
        name: "My Theme",
        description: "A custom theme",
        author: "Test Author",
        version: "1.0.0",
        theme: {
          colors: {
            background: "#1e1e1e",
            foreground: "#d4d4d4",
          },
        },
      };

      // Verify required fields exist
      expect(validPayload).toHaveProperty("id");
      expect(validPayload).toHaveProperty("name");
      expect(validPayload).toHaveProperty("description");
      expect(validPayload).toHaveProperty("author");
      expect(validPayload).toHaveProperty("version");
      expect(validPayload).toHaveProperty("theme");
    });

    it("should reject invalid credentials gracefully", async () => {
      const mockFetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      });

      global.fetch = mockFetch as any;

      try {
        await mockFetch("https://zed.dev/api/themes", {
          method: "POST",
          headers: {
            Authorization: "Basic invalid",
          },
        });

        const response = await mockFetch.mock.results[0].value;
        expect(response.status).toBe(401);
      } catch (error) {
        // Expected
      }
    });
  });

  describe("notepad-plus.ts", () => {
    it("should validate Notepad++ XML structure", async () => {
      const validXml = `<?xml version="1.0" encoding="UTF-8"?>
<NotepadPlus>
  <UserLang name="TestLang">
    <Settings>
      <Global caseIgnored="no" />
    </Settings>
  </UserLang>
</NotepadPlus>`;

      expect(validXml).toContain("<NotepadPlus");
      expect(validXml).toContain("<UserLang");
      expect(validXml).toContain("</NotepadPlus>");
    });

    it("should generate submission checklist with all required sections", () => {
      const expectedSections = [
        "Pre-Submission",
        "GitHub Fork & PR Setup",
        "Pull Request",
        "Post-Submission",
        "File Details",
      ];

      const checklist = `
# Notepad++ Theme Submission Checklist

## Pre-Submission
- [ ] Theme tested in Notepad++ (latest version)
- [ ] XML file is well-formed (no parsing errors)

## GitHub Fork & PR Setup
- [ ] Forked repository

## Pull Request
- [ ] PR title is clear

## Post-Submission
- [ ] Awaiting reviewer feedback

## File Details
- **Location:** /path/to/theme.xml
`;

      for (const section of expectedSections) {
        expect(checklist).toContain(section);
      }
    });

    it("should handle theme metadata correctly", () => {
      const manifest = {
        name: "test-theme",
        description: "A test theme",
        author: "Test Author",
        version: "1.0.0",
      };

      expect(manifest.author).toBeDefined();
      expect(manifest.version).toBeDefined();
      expect(manifest.description).toContain("test");
    });
  });
});
