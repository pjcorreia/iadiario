// Projects data embedded directly to avoid CORS issues when opening locally
const projectsData = [
    {
        "id": 1,
        "title": "IA Diário Website",
        "titleEn": "IA Diário Website",
        "description": "Website para o projeto IA Diário, criado com HTML, CSS e JavaScript.",
        "descriptionEn": "Website for the IA Diário project, created with HTML, CSS and JavaScript.",
        "date": "2025-03-04",
        "image": "iadiario.jpg",
        "url": "https://iadiario.pt"
    },
    {
        "id": 2,
        "title": "Infinitos Sudoku",
        "titleEn": "Sudoku Infinite",
        "description": "Website com sudokus infinitos. Este projecto foi criado em Vs Code e Clive (3 minutos).",
        "descriptionEn": "Website with infinite sudokus. This project was created in VS Code and Clive (3 minutes).",
        "date": "2025-03-05",
        "image": "sudokuinfinite.jpg",
        "url": "https://sudokuinfinite.pt"
    }
];

document.addEventListener('DOMContentLoaded', function() {
    const projectsContainer = document.getElementById('projects-container');
    const currentLang = document.querySelector('.lang-btn.active').dataset.lang;
    
    // Render projects
    renderProjects(projectsData, currentLang);
    
    // Scroll animation
    const fadeElements = document.querySelectorAll('.fade-in');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });
    
    fadeElements.forEach(el => observer.observe(el));
    
    // Header scroll effect
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
    
    // Language switcher
    const langButtons = document.querySelectorAll('.lang-btn');
    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (!btn.classList.contains('active')) {
                document.querySelector('.lang-btn.active').classList.remove('active');
                btn.classList.add('active');
                
                const lang = btn.dataset.lang;
                switchLanguage(lang);
                
                // Render projects with the new language using the embedded data
                renderProjects(projectsData, lang);
            }
        });
    });
});

function switchLanguage(lang) {
    const elements = document.querySelectorAll('[data-en], [data-pt]');
    elements.forEach(el => {
        if (el.dataset[lang]) {
            el.textContent = el.dataset[lang];
        }
    });
}

function renderProjects(projects, lang) {
    const projectsContainer = document.getElementById('projects-container');
    projectsContainer.innerHTML = '';
    
    projects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'project-card';
        
        const title = lang === 'en' ? project.titleEn : project.title;
        const description = lang === 'en' ? project.descriptionEn : project.description;
        const viewProject = lang === 'en' ? 'View Project' : 'Ver Projeto';
        
        card.innerHTML = `
            <img src="${project.image}" alt="${title}" class="project-image">
            <div class="project-content">
                <span class="project-number">#${project.id}</span>
                <h3 class="project-title">${title}</h3>
                <p class="project-desc">${description}</p>
                <a href="${project.url}" class="project-link">${viewProject} <i class="fas fa-arrow-right"></i></a>
            </div>
        `;
        
        projectsContainer.appendChild(card);
    });
}
