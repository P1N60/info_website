const fs = require('fs');

const conjointContent = fs.readFileSync('docs/luts_conjoint_test.html', 'utf8');
const originalTestContent = fs.readFileSync('docs/personal_test.html', 'utf8');

// Extract styles from conjoint into a <style> block
const conjointStyleMatch = conjointContent.match(/<style>([\s\S]*?)<\/style>/);
const cssVarsAndRules = conjointStyleMatch ? conjointStyleMatch[1] : '';

// Extract HTML from conjoint
const conjointHtmlMatch = conjointContent.match(/<div class="page">([\s\S]*?)<\/div>\s*<script>/);
const conjointHtml = conjointHtmlMatch ? conjointHtmlMatch[1] : '';

// Extract JS from conjoint
const conjointJsMatch = conjointContent.match(/<script>\s*(\(function\(\)\{[\s\S]*?\}\(\));\s*<\/script>/);
let conjointJs = conjointJsMatch ? conjointJsMatch[1] : '';

// Modify JS for "stop when best treatment is found with certainty"
const certainLogic = `
  function isBestTreatmentCertain() {
    if (state.taskIndex < 5) return false;
    const pw = computePartworths();
    const candidates = TREATMENTS.filter(t=>state.selectedKeys.includes(t.key));
    if (candidates.length < 2) return true;
    const scored = candidates.map(t=>{
      let total=0;
      ATTRS.forEach(a=>{ total += partworthAt(a.key, t.values[a.key], pw); });
      return {t, total};
    });
    scored.sort((a,b)=>b.total-a.total);
    const diff = scored[0].total - scored[1].total;
    // difference of 1.0 is considered enough certainty in these partworth scales
    return diff > 1.0;
  }
`;

// Replace handleChoice to use the certainty check
conjointJs = conjointJs.replace(
  /function handleChoice\(side\)\{[\s\S]*?renderTask\(\);\s*\n\s*\}/,
  `function handleChoice(side){
    recordChoice(side);
    state.taskIndex++;
    if(isBestTreatmentCertain() || state.taskIndex >= 15){
      renderResult();
      showScreen('screen-result');
    } else {
      nextTask();
      renderTask();
    }
  }`
);

// Inject certainLogic before handleChoice
conjointJs = conjointJs.replace('function handleChoice(side)', certainLogic + '\n  function handleChoice(side)');

// Instead of max tasks 9, let's keep it fluid in the UI text
conjointJs = conjointJs.replace(
  "document.getElementById('progressLabel').textContent = 'Spørgsmål '+(state.taskIndex+1)+' af '+state.totalTasks;",
  "document.getElementById('progressLabel').textContent = 'Spørgsmål '+(state.taskIndex+1) + (state.taskIndex > 8 ? ' (ekstra spørgsmål for sikkerhed)' : ' af ca. 10');"
);
conjointJs = conjointJs.replace("document.getElementById('progressFill').style.width = (state.taskIndex/state.totalTasks*100)+'%';", 
  "document.getElementById('progressFill').style.width = Math.min((state.taskIndex/10)*100, 100)+'%';");
conjointJs = conjointJs.replace(/const MAX_TASKS = 9;/g, "const MAX_TASKS = 15;");
conjointJs = conjointJs.replace(/Trin 2 af 2 · de 9 valg/g, "Trin 2 af 2 · personlige valg");

// Modify HTML UI texts
let updatedHtml = conjointHtml
  .replace(/de næste 9 valg/g, "dine efterfølgende valg")
  .replace(/de 9 valg/g, "valgene")
  .replace(/Start de 9 valg →/g, "Start testen →")
  .replace(/de 9 spørgsmål/g, "spørgsmålene");

// Read header from personal_test.html
const startHeaderMatch = originalTestContent.match(/([\s\S]*?)<main([\s\S]*?)>/i) || originalTestContent.match(/([\s\S]*?)<body.*?>[\s\S]*?<header>([\s\S]*?)<\/header>/);
let headerStr = "";
if(originalTestContent.includes('<header>')) {
    headerStr = originalTestContent.split('<main')[0]; // simple approximation
    // Let's grab up to the end of </header>
    headerStr = originalTestContent.substring(0, originalTestContent.indexOf('</header>') + 9);
}

// Assemble
const finalDocument = `
${headerStr}
<style>
${cssVarsAndRules.replace(/body\{.*?\}/, '')} /* Remove body overrides to keep site styles */
.page { margin-top: 20px; }
.tp-card.selected .tp-name, .rank-name { color: #2c5aa0; }
.tp-card.selected .tp-circle, .progress-fill, .imp-fill, .match-fill { background: #4a90d9 !important; }
.start-btn, .choose-btn:hover { background: #2c5aa0 !important; border-color: #2c5aa0 !important; }
.choose-btn { color: #2c5aa0 !important; border-color: #2c5aa0 !important; }
</style>

<main class="page">
${updatedHtml}
</main>

<script>
${conjointJs}
</script>
<script src="mobile-dropdown.js"></script>
</body>
</html>
`;

fs.writeFileSync('docs/personal_test.html', finalDocument);
console.log('Done replacement');
