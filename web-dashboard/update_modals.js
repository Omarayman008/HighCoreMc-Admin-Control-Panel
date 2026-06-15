const fs = require('fs');
const path = require('path');

const componentsDirs = [
  path.join(__dirname, 'src', 'app', 'dashboard', 'discord', 'staff', 'components'),
  path.join(__dirname, 'src', 'app', 'dashboard', 'minecraft', 'staff', 'components')
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Reduce Modal maxWidth
  content = content.replace(/maxWidth: '480px'/g, "maxWidth: '420px'");
  content = content.replace(/maxWidth: '500px'/g, "maxWidth: '420px'");
  
  // Reduce Modal padding
  content = content.replace(/padding: '1\.5rem'/g, "padding: '1.2rem'");
  content = content.replace(/padding: '2rem'/g, "padding: '1.2rem'");

  // Form gap reduction
  content = content.replace(/gap: '0\.8rem'/g, "gap: '0.6rem'");

  // Input/Textarea padding reduction
  content = content.replace(/padding: '0\.8rem'/g, "padding: '0.5rem 0.6rem'");
  content = content.replace(/padding: '0\.6rem'/g, "padding: '0.4rem 0.5rem'");

  // Label improvements
  content = content.replace(/fontSize: '0\.85rem'/g, "fontSize: '0.75rem'");
  content = content.replace(/fontSize: '0\.9rem'/g, "fontSize: '0.8rem'");
  content = content.replace(/marginBottom: '0\.5rem'/g, "marginBottom: '0.2rem'");
  content = content.replace(/marginBottom: '0\.3rem'/g, "marginBottom: '0.2rem'");
  
  // Image uploader box specific (was 0.8rem padding, which got replaced)
  // Let's make sure it's tight
  content = content.replace(/minHeight: '60px'/g, "minHeight: '40px'");

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log('Updated:', filePath);
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
