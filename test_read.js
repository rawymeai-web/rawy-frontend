import fs from 'fs';
const data = JSON.parse(fs.readFileSync('C:/Users/s_eme/Downloads/Order_RWY-H9P6A92QC_Package/workflow_artifacts/full_story_data.json', 'utf-8'));
data.pages.forEach((p, i) => {
    const url = p.illustrationUrl || 'NONE';
    const name = url.split('/').pop() || 'NONE';
    console.log(`Page ${i + 1}: ${name}`);
});
