// Load projects data from JSON file
let projectsData = [];

document.addEventListener('DOMContentLoaded', function() {
    const projectsContainer = document.getElementById('projects-container');
    const currentLang = document.querySelector('.lang-btn.active').dataset.lang;
    
    // Fetch projects data from JSON file
    fetch('projects.json')
        .then(response => response.json())
        .then(data => {
            projectsData = data;
            // Render projects after data is loaded
            renderProjects(projectsData, currentLang);
        })
        .catch(error => {
            console.error('Error loading projects data:', error);
            projectsContainer.innerHTML = '<p>Error loading projects. Please try again later.</p>';
        });
    
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
