// Elementos do DOM
const searchInput = document.getElementById('searchInput');
const yearFilter = document.getElementById('yearFilter');
const categoryFilter = document.getElementById('categoryFilter');
const resultsContainer = document.getElementById('resultsContainer');
const loadingIndicator = document.getElementById('loadingIndicator');
const statusMessage = document.getElementById('statusMessage');

// Variáveis globais
let allPrizes = [];

// Traduções das categorias
const translatedCategories = {
    'chemistry': 'Química',
    'economics': 'Ciências Econômicas', 
    'literature': 'Literatura',
    'peace': 'Paz',
    'physics': 'Física',
    'medicine': 'Medicina',
};

// ** TODAS AS FUNÇÕES E CHAVES DE API DO GEMINI/IA FORAM REMOVIDAS **


// Função para preencher o filtro de anos
function populateYearFilter() {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= 1901; i--) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        yearFilter.appendChild(option);
    }
}

// Função para buscar dados da API (Nobel)
async function fetchPrizes() {
    loadingIndicator.classList.remove('hidden');
    resultsContainer.innerHTML = '';
    statusMessage.classList.add('hidden');

    try {
        const maxRetries = 3;
        let response = null;
        for (let i = 0; i < maxRetries; i++) {
            try {
                response = await fetch('https://api.nobelprize.org/v1/prize.json');
                if (response.ok) break;
            } catch (e) {
                if (i < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
                } else {
                    throw e;
                }
            }
        }
        
        if (!response || !response.ok) {
            throw new Error(`Erro na requisição: ${response ? response.status : 'Sem resposta'}`);
        }
        
        const data = await response.json();
        
        if (data && data.prizes && data.prizes.length > 0) {
            allPrizes = data.prizes.sort((a, b) => parseInt(b.year) - parseInt(a.year));
        } else {
            throw new Error('Nenhum prêmio encontrado na API.');
        }
    } catch (error) {
        console.error('Erro ao buscar os dados da API:', error);
        allPrizes = [];
        displayStatus('Erro ao carregar dados do Prêmio Nobel. Verifique sua conexão ou tente novamente mais tarde.', 'status-error');
        loadingIndicator.classList.add('hidden');
        return;
    } 
    
    loadingIndicator.classList.add('hidden');
    if (allPrizes.length > 0) {
        displayPrizes(allPrizes); 
    }
}

// Função para exibir os prêmios na página principal
function displayPrizes(prizes) {
    let htmlContent = '';
    resultsContainer.innerHTML = '';
    
    if (prizes.length === 0) {
        displayStatus('Nenhum resultado encontrado para a sua pesquisa.', 'status-info');
    } else {
        statusMessage.classList.add('hidden');
        prizes.forEach((prize, index) => {
            const category = prize.category || 'N/A';
            const year = prize.year || 'N/A';
            const laureates = prize.laureates || [];
            
            laureates.sort((a, b) => {
                const nameA = `${a.firstname || ''} ${a.surname || ''}`.trim().toLowerCase();
                const nameB = `${b.firstname || ''} ${b.surname || ''}`.trim().toLowerCase();
                return nameA.localeCompare(nameB);
            });

            let laureatesHtml = laureates.map(laureate => {
                const fullName = `${laureate.firstname || ''} ${laureate.surname || ''}`.trim();
                const country = laureate.affiliations && laureate.affiliations.length > 0 && laureate.affiliations[0].country ? laureate.affiliations[0].country : '';
                
                let countryHtml = '';
                if (country) {
                    countryHtml = `<p class="text-xs text-muted mt-0.5">${country}</p>`;
                }
                
                return `<p class="text-base font-medium">${fullName || 'N/A'}</p>${countryHtml}`;
            }).join('');

            const translatedCategory = translatedCategories[category.toLowerCase()] || category;
            
            const blueCategories = ['physics', 'peace'];
            // A classe 'cursor-pointer' foi removida
            const cardClass = blueCategories.includes(category.toLowerCase()) ? 'prize-card blue-accent' : 'prize-card';

            htmlContent += `
                <div 
                    class="${cardClass} p-5 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300"
                >
                    <h3 class="text-lg font-bold mb-2">
                        ${year} - ${translatedCategory}
                    </h3>
                    <div class="mt-2 space-y-1">
                        ${laureatesHtml}
                    </div>
                </div>
            `;
        });
        resultsContainer.innerHTML = htmlContent;
    }
}

// ** AS FUNÇÕES 'showEnlargedCard', 'formatMarkdownOutput' E SEUS LISTENERS FORAM REMOVIDOS **


// Função para filtrar os prêmios
function filterPrizes() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedYear = yearFilter.value;
    const selectedCategory = categoryFilter.value.toLowerCase();

    let filteredPrizes = allPrizes.filter(prize => {
        const year = prize.year;
        const category = prize.category.toLowerCase();
        
        const matchesYear = selectedYear === '' || year === selectedYear;
        const matchesCategory = selectedCategory === '' || category === selectedCategory;

        let matchesSearchTerm = true;
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const yearMatch = year.includes(searchLower);
            
            const translatedCatMatch = translatedCategories[category] ? translatedCategories[category].toLowerCase().includes(searchLower) : false;
            const categoryMatch = category.includes(searchLower);
            
            const laureatesMatch = (prize.laureates || []).some(laureate => {
                const fullName = `${laureate.firstname || ''} ${laureate.surname || ''}`.toLowerCase();
                return fullName.includes(searchLower);
            });

            matchesSearchTerm = yearMatch || translatedCatMatch || categoryMatch || laureatesMatch;
        }

        return matchesSearchTerm && matchesYear && matchesCategory;
    });
    
    displayPrizes(filteredPrizes);
}

// Função para exibir mensagens de status
function displayStatus(message, colorClass) {
    statusMessage.textContent = message;
    statusMessage.className = `block p-4 rounded-lg font-medium text-center ${colorClass}`;
    statusMessage.classList.remove('hidden');
}

// Eventos para carregar os dados e buscar
window.addEventListener('load', () => {
    populateYearFilter();
    fetchPrizes();
});

searchInput.addEventListener('input', filterPrizes);
yearFilter.addEventListener('change', filterPrizes);
categoryFilter.addEventListener('change', filterPrizes);

// ** EVENTOS DE MODAL (CLIQUE NO CARTÃO, FECHAR, ESCAPE) FORAM REMOVIDOS **