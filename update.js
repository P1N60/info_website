const fs = require('fs');
const filepath = 'docs/læge/index.html';
const content = fs.readFileSync(filepath, 'utf8');

const regex = /<script>[\s\S]*?<\/script>/;
const newScript = `<script>
  const patientNameInput = document.getElementById('patientName');
  const commentInput = document.getElementById('comment');
  const treatmentCheckboxes = document.querySelectorAll('input[name="treatments"]');
  
  const text0 = "Her er information og overblik over de behandlingsmuligheder, vi talte om.";
  const text1 = "Her er information om den valgte behandlingsmulighed, vi talte om.";
  const textMany = "Her er information og overblik over de valgte behandlingsmuligheder, vi talte om.";

  function getStandardText() {
    const checkedCount = document.querySelectorAll('input[name="treatments"]:checked').length;
    if (checkedCount === 0) return text0;
    if (checkedCount === 1) return text1;
    return textMany;
  }
  
  function updateComment() {
    const currentName = patientNameInput.value.trim();
    const commentVal = commentInput.value.trim();
    
    const isStandard = commentVal === "" || 
                       commentVal.includes(text0) || 
                       commentVal.includes(text1) || 
                       commentVal.includes(textMany);
    
    if (isStandard) {
      if (currentName) {
        commentInput.value = \`Kære \${currentName},\\n\\n\${getStandardText()}\`;
      } else {
        commentInput.value = "";
      }
    }
  }
  
  patientNameInput.addEventListener('input', updateComment);
  
  treatmentCheckboxes.forEach(cb => {
    cb.addEventListener('change', updateComment);
  });

  document.getElementById('mailForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const patientName = document.getElementById('patientName').value.trim();
    const name = document.getElementById('name').value.trim();
    const hospital = document.getElementById('hospital').value;
    let comment = document.getElementById('comment').value.trim();

    const checkboxes = document.querySelectorAll('input[name="treatments"]:checked');
    const checkedCount = checkboxes.length;
    const selectedTreatments = Array.from(checkboxes).map(cb => cb.value).join(',');

    if (!comment) {
      comment = \`Kære \${patientName},\\n\\n\${getStandardText()}\`;
    }

    let linksText = "";
    if (checkedCount === 0) {
      linksText = \`Læs om behandlinger:\\nhttps://vandladningsbesvær.dk/treatment_info.html\`;
    } else if (checkedCount === 1) {
      linksText = \`Læs om den valgte behandling:\\nhttps://vandladningsbesvær.dk/treatment_info.html?treatments=\${selectedTreatments}\`;
    } else {
      linksText = \`Læs om de valgte behandlinger:\\nhttps://vandladningsbesvær.dk/treatment_info.html?treatments=\${selectedTreatments}\\n\\nSammenlign de valgte behandlinger:\\nhttps://vandladningsbesvær.dk/comparison.html?treatments=\${selectedTreatments}\`;
    }

    const bodyText = \`\${comment}\\n\\n---\\n\${linksText}\\n---\\nMed venlig hilsen\\n\${name}\\n\${hospital}\`;

    const subject = encodeURIComponent('Behandlingsmuligheder - BPH');
    const body = encodeURIComponent(bodyText);

    const mailtoLink = \`mailto:\${encodeURIComponent(email)}?subject=\${subject}&body=\${body}\`;
    window.location.href = mailtoLink;
  });
</script>`;

const newContent = content.replace(regex, newScript);
fs.writeFileSync(filepath, newContent, 'utf8');
