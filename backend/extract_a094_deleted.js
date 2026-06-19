const fs = require("fs");
const path = require("path");

const checkInFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes("CreateReport.jsx") || line.includes("reportService.js") || line.includes("ViewReport.jsx") || line.includes("ReportList.jsx")) {
      try {
        const obj = JSON.parse(line);
        // Look inside tool calls
        if (obj.tool_calls) {
          obj.tool_calls.forEach(tc => {
            if (tc.name === "write_to_file") {
              const args = JSON.parse(tc.arguments);
              console.log(`FOUND write_to_file for ${args.TargetFile}`);
              // Write it back to check if it's there
              const target = args.TargetFile;
              const dir = path.dirname(target);
              if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
              fs.writeFileSync(target, args.CodeContent, "utf8");
              console.log(`  Restored ${target}`);
            }
          });
        }
      } catch (e) {
        // console.log(`  Failed: ${e.message}`);
      }
    }
  }
};

const logDir = `C:\\Users\\prem\\.gemini\\antigravity\\brain\\a0940bfc-1322-47f9-a50c-08b6fbb996bc\\.system_generated\\logs`;
checkInFile(path.join(logDir, "transcript.jsonl"));
checkInFile(path.join(logDir, "transcript_full.jsonl"));
console.log("Check complete.");
