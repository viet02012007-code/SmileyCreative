import { useState } from 'react';
import PageTransition from '../components/PageTransition';
import ProjectList from '../components/projects/ProjectList';
import ProjectDetail from '../components/projects/ProjectDetail';

export default function Projects() {
    const [selectedProject, setSelectedProject] = useState<any>(null);

    return (
        <PageTransition style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--color-surface)' }}>
            {!selectedProject ? (
                <ProjectList onSelectProject={setSelectedProject} />
            ) : (
                <ProjectDetail project={selectedProject} onBack={() => setSelectedProject(null)} />
            )}
        </PageTransition>
    );
}
