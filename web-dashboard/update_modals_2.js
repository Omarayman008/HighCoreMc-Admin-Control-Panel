const fs = require('fs');
const path = require('path');

const componentsDirs = [
  path.join(__dirname, 'src', 'app', 'dashboard', 'discord', 'staff', 'components'),
  path.join(__dirname, 'src', 'app', 'dashboard', 'minecraft', 'staff', 'components')
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  content = content.replace(/maxHeight: '85vh'/g, "maxHeight: '80vh'");
  content = content.replace(/maxHeight: '90vh'/g, "maxHeight: '80vh'");
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
  }
}

componentsDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach(file => {
      if (file.endsWith('.tsx')) {
        processFile(path.join(dir, file));
      }
    });
  }
});
