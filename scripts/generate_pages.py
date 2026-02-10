import os
import json
import re

# Paths
BASE_DIR = os.getcwd()
PROJECTS_JSON = os.path.join(BASE_DIR, 'data', 'projects.json')
PROJECT_CARDS_DIR = os.path.join(BASE_DIR, 'project_cards')
OUTPUT_DIR = os.path.join(BASE_DIR, 'projects')
TEMPLATE_FILE = os.path.join(BASE_DIR, 'project_template.html')

def load_template():
    with open(TEMPLATE_FILE, 'r', encoding='utf-8') as f:
        return f.read()

def load_projects_data():
    with open(PROJECTS_JSON, 'r', encoding='utf-8') as f:
        return json.load(f)

def parse_markdown(md_content):
    data = {}
    
    # Simple regex parsing based on the fixed structure
    data['real_name'] = re.search(r'\*\*Real Name:\*\*\s*(.*)', md_content).group(1).strip()
    data['codename'] = re.search(r'\*\*Codename:\*\*\s*(.*)', md_content).group(1).strip()
    
    # Status handling (Machine vs Label)
    status_label_match = re.search(r'\*\*Status Label \(Display\):\*\*\s*(.*)', md_content)
    if status_label_match:
        data['status_display'] = status_label_match.group(1).strip()
    else:
        # Fallback for old format if regex fails
        status_match = re.search(r'\*\*Status:\*\*\s*(.*)', md_content)
        data['status_display'] = status_match.group(1).strip() if status_match else "UNKNOWN"

    data['short_tagline'] = re.search(r'\*\*Short Tagline \(7-12 words\):\*\*\s*\n(.*)', md_content).group(1).strip()
    
    flavor_match = re.search(r'\*\*Flavor Description.*\*\*\s*\n(.*)', md_content)
    data['flavor'] = flavor_match.group(1).strip() if flavor_match else ""
    
    # Full Description (Extract paragraphs between headers)
    full_desc_match = re.search(r'## Full Description\s*\n\s*\*\*.*?\*\*\s*\n.*?\)\s*\n\n(.*?)\n\n##', md_content, re.DOTALL)
    if full_desc_match:
        raw_desc = full_desc_match.group(1).strip()
        # Convert simple paragraphs to <p>
        data['full_desc'] = ''.join([f'<p>{p.strip()}</p>' for p in raw_desc.split('\n\n')])
    else:
        data['full_desc'] = "<p>No description available.</p>"

    # Feature List
    features_match = re.search(r'## Feature List\s*\n\s*\*\*[^*]*\*\*\s*\n(.*?)\n\n\*\*', md_content, re.DOTALL)
    features_html = ""
    if features_match:
        raw_features = features_match.group(1).strip()
        for line in raw_features.split('\n'):
            if line.startswith('- '):
                feat_text = line[2:].strip()
                if "**" in feat_text:
                    # Bold title handling
                    parts = feat_text.split("**")
                    if len(parts) >= 3:
                        title = parts[1]
                        desc = parts[2].strip().lstrip(':').strip()
                        features_html += f'<div class="feature-card"><h4 style="color:var(--accent-gold); margin-bottom:0.5rem;">{title}</h4><p>{desc}</p></div>'
                    else:
                        features_html += f'<div class="feature-card"><p>{feat_text}</p></div>'
                else:
                    features_html += f'<div class="feature-card"><p>{feat_text}</p></div>'
    data['features_html'] = features_html

    # Roadmap
    roadmap_html = ""
    roadmap_section = re.search(r'## Roadmap\s*\n(.*?)## Trust Facts', md_content, re.DOTALL)
    if roadmap_section:
        raw_roadmap = roadmap_section.group(1).strip()
        # Very basic parsing for now, grouping by sections
        lines = raw_roadmap.split('\n')
        current_phase = ""
        for line in lines:
            line = line.strip()
            if "**" in line and "Near-term" in line:
                current_phase = "NEAR-TERM"
            elif "**" in line and "Mid-term" in line:
                current_phase = "MID-TERM"
            elif "**" in line and "Long-term" in line:
                current_phase = "LONG-TERM"
            elif line.startswith('1. ') or line.startswith('2. ') or line.startswith('3. '):
                task = line[3:].strip()
                roadmap_html += f'<div class="roadmap-item"><div class="roadmap-phase">{current_phase}</div><div style="flex-grow:1;">{task}</div></div>'
            elif line and not line.startswith('**') and not line.startswith('('):
                 # Catch-all for long term paragraph
                 if current_phase == "LONG-TERM":
                     roadmap_html += f'<div class="roadmap-item"><div class="roadmap-phase">{current_phase}</div><div style="flex-grow:1;">{line}</div></div>'
    data['roadmap_html'] = roadmap_html

    # Trust Facts
    trust_html = ""
    trust_section = re.search(r'## Trust Facts\s*\n(.*?)## Downloads', md_content, re.DOTALL)
    if trust_section:
        raw_trust = trust_section.group(1).strip()
        for line in raw_trust.split('\n'):
            if line.startswith('- **'):
                parts = line.split('**')
                label = parts[1].strip().rstrip(':')
                value = parts[2].strip().lstrip(':').strip()
                trust_html += f'<li><span style="color:var(--text-muted);">{label}:</span> {value}</li>'
    data['trust_html'] = trust_html

    return data

def generate_pages():
    print("Loading data...")
    projects = load_projects_data()
    template = load_template()
    
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    for p in projects:
        pid = p['id']
        md_path = os.path.join(PROJECT_CARDS_DIR, f"{pid}.md")
        
        if not os.path.exists(md_path):
            print(f"Skipping {pid}: No markdown found.")
            continue
            
        print(f"Processing {pid}...")
        
        with open(md_path, 'r', encoding='utf-8') as f:
            md_content = f.read()
            
        try:
            parsed = parse_markdown(md_content)
        except Exception as e:
            print(f"Error parsing {pid}: {e}")
            continue
            
        # Fill Template
        html = template
        html = html.replace('{{REAL_NAME}}', parsed['real_name'])
        html = html.replace('{{CODENAME}}', parsed['codename'])
        html = html.replace('{{STATUS_DISPLAY}}', parsed.get('status_display', 'UNKNOWN'))
        html = html.replace('{{SHORT_TAGLINE}}', parsed['short_tagline'])
        html = html.replace('{{FLAVOR_DESCRIPTION}}', parsed['flavor'])
        html = html.replace('{{FULL_DESCRIPTION}}', parsed['full_desc'])
        html = html.replace('{{FEATURES_HTML}}', parsed['features_html'])
        html = html.replace('{{ROADMAP_HTML}}', parsed['roadmap_html'])
        html = html.replace('{{TRUST_FACTS_HTML}}', parsed['trust_html'])
        
        # Download Links (From JSON mostly, or placeholder)
        links_html = ""
        if p.get('links'):
            for link in p['links']:
                links_html += f'<a href="{link["url"]}" class="btn btn-primary">{link["label"]}</a>'
        else:
             links_html = '<div class="mono" style="color:var(--text-muted);">// NO ARTIFACTS AVAILABLE</div>'
        
        html = html.replace('{{DOWNLOAD_LINKS_HTML}}', links_html)
        
        # Save
        out_path = os.path.join(OUTPUT_DIR, f"{pid}.html")
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(html)
            
    print("Done.")

if __name__ == "__main__":
    generate_pages()
