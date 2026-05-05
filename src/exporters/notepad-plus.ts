import { Manifest } from "../core/manifest";

interface NotepadStyle {
  name: string;
  styleID: string;
  fgColor?: string;
  bgColor?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})?([a-f\d]{2})?([a-f\d]{2})?$/i.exec(hex);
  if (!result || !result[1] || !result[2] || !result[3]) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

function rgbToNotepadFormat(r: number, g: number, b: number): string {
  return `${b.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${r.toString(16).padStart(2, "0")}`;
}

function buildTokenStyle(scope: string, settings: Record<string, any>): NotepadStyle {
  const style: NotepadStyle = {
    name: scope,
    styleID: scope,
  };

  if (settings.foreground) {
    const rgb = hexToRgb(settings.foreground);
    style.fgColor = rgbToNotepadFormat(rgb.r, rgb.g, rgb.b);
  }

  if (settings.background) {
    const rgb = hexToRgb(settings.background);
    style.bgColor = rgbToNotepadFormat(rgb.r, rgb.g, rgb.b);
  }

  if (settings.fontStyle?.includes("bold")) {
    style.bold = true;
  }
  if (settings.fontStyle?.includes("italic")) {
    style.italic = true;
  }
  if (settings.fontStyle?.includes("underline")) {
    style.underline = true;
  }

  return style;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function exportNotepadPlus(manifest: Manifest): string {
  const editorBgColor = manifest.colors?.["editor.background"] || "#ffffff";
  const editorFgColor = manifest.colors?.["editor.foreground"] || "#000000";

  const bgRgb = hexToRgb(editorBgColor);
  const fgRgb = hexToRgb(editorFgColor);

  let xml = `<?xml version="1.0" encoding="UTF-8" ?>
<NotepadPlus>
  <UserLang name="${escapeXml(manifest.name)}" ext="txt" udlVersion="2.1">
    <Settings>
      <Global caseIgnored="no" allowFoldOfComments="no" foldCompact="no" forcePureLC="0" />
      <TotalKeywordLists number="1">
        <KeywordList name="Delimiters">
          <Keyword name="0" value="0" />
        </KeywordList>
      </TotalKeywordLists>
    </Settings>
    <KeywordLists />
    <Styles>
      <WordsStyle name="DEFAULT" styleID="0" fgColor="${rgbToNotepadFormat(fgRgb.r, fgRgb.g, fgRgb.b)}" bgColor="${rgbToNotepadFormat(bgRgb.r, bgRgb.g, bgRgb.b)}" fontName="" fontStyle="0" fontSize="" />
`;

  let styleId = 1;
  for (const [scope, settings] of Object.entries(manifest.tokens || {})) {
    const style = buildTokenStyle(scope, settings);

    let styleFlags = 0;
    if (style.bold) styleFlags |= 1;
    if (style.italic) styleFlags |= 2;
    if (style.underline) styleFlags |= 4;

    const fgColor = style.fgColor || rgbToNotepadFormat(fgRgb.r, fgRgb.g, fgRgb.b);
    const bgColor = style.bgColor || rgbToNotepadFormat(bgRgb.r, bgRgb.g, bgRgb.b);

    xml += `      <WordsStyle name="${escapeXml(style.name)}" styleID="${styleId}" fgColor="${fgColor}" bgColor="${bgColor}" fontName="" fontStyle="${styleFlags}" fontSize="" />\n`;
    styleId++;
  }

  xml += `    </Styles>
  </UserLang>
</NotepadPlus>`;

  return xml;
}
