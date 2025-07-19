import os
import re
from pathlib import Path

def update_scss_imports(file_path):
    """Update SCSS imports from @import to @use syntax"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Update imports
    if '@import' in content:
        print(f"Updating {file_path}")
        
        # Replace @import './variables'; with @use './variables' as *;
        content = re.sub(
            r'@import\s+[\'"]([^\'"]*)/_?variables[\'"];', 
            r'@use \'\1/_variables\' as *;', 
            content
        )
        content = re.sub(
            r'@import\s+[\'"]([^\'"]*)/variables[\'"];', 
            r'@use \'\1/variables\' as *;', 
            content
        )
        
        # Replace @import './mixins'; with @use './mixins' as *;
        content = re.sub(
            r'@import\s+[\'"]([^\'"]*)/_?mixins[\'"];', 
            r'@use \'\1/_mixins\' as *;', 
            content
        )
        content = re.sub(
            r'@import\s+[\'"]([^\'"]*)/mixins[\'"];', 
            r'@use \'\1/mixins\' as *;', 
            content
        )
        
        # Add sass:color import if needed
        if 'lighten(' in content or 'darken(' in content:
            if '@use \'sass:color\';' not in content:
                content = '@use \'sass:color\';\n' + content
        
        # Replace color functions
        content = content.replace('lighten(', 'color.adjust(')
        content = re.sub(r'lighten\(\s*([^,]+),\s*(\d+)%\s*\)', r'color.adjust(\1, $lightness: \2%)', content)
        
        content = content.replace('darken(', 'color.adjust(')
        content = re.sub(r'darken\(\s*([^,]+),\s*(\d+)%\s*\)', r'color.adjust(\1, $lightness: -\2%)', content)
        
        # Write updated content
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return True
    
    return False

def find_and_update_scss_files(directory):
    """Find all SCSS files and update them"""
    updated_count = 0
    
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.scss'):
                file_path = os.path.join(root, file)
                if update_scss_imports(file_path):
                    updated_count += 1
    
    return updated_count

if __name__ == "__main__":
    frontend_dir = Path("frontend/src")
    if not frontend_dir.exists():
        print(f"Directory {frontend_dir} not found")
        exit(1)
    
    updated = find_and_update_scss_files(frontend_dir)
    print(f"Updated {updated} SCSS files") 