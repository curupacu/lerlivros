document.addEventListener('DOMContentLoaded', () => {
    // === CONFIGURAÇÕES DA API DO GOOGLE LIVROS ===
    const API_KEY = 'AIzaSyDUU572Ef-8gO4RsPiV-FeOnIdgUsRiHxs'; // A SUA CHAVE DE API

    const BASE_URL = 'https://www.googleapis.com/books/v1/volumes?q=';

    console.log('Script iniciado. API_KEY:', API_KEY ? 'Presente' : 'Ausente ou vazia');

    // Função para buscar livros da API
    async function fetchBooks(query, maxResults = 10) {
        let url = `${BASE_URL}${query}&maxResults=${maxResults}`;
        if (API_KEY && API_KEY !== 'AIzaSyDUU572Ef-8gO4RsPiV-FeOnIdgUsRiHxs') {
            url += `&key=${API_KEY}`;
        }

        console.log(`Buscando livros para a query: "${query}" na URL: ${url}`);

        try {
            const response = await fetch(url);
            console.log(`Resposta da API para "${query}": Status ${response.status}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Não foi possível ler os detalhes do erro JSON.' }));
                console.error(`Erro na requisição para a query "${query}": ${response.status} ${response.statusText}`, errorData);
                return [];
            }
            const data = await response.json();
            console.log(`Dados recebidos para "${query}":`, data);
            return data.items || [];
        } catch (error) {
            console.error('Erro geral ao buscar livros (problema de rede ou CORS):', error);
            return [];
        }
    }

    // Função para criar um card de livro
    function createBookCard(book) {
        const bookCard = document.createElement('div');
        bookCard.classList.add('book-card');

        // Adiciona um listener de clique a cada card de livro
        bookCard.addEventListener('click', () => {
            openBookModal(book); // Chama a função para abrir o modal com os dados do livro clicado
        });

        const imageUrl = book.volumeInfo.imageLinks?.thumbnail || book.volumeInfo.imageLinks?.smallThumbnail || 'https://via.placeholder.com/100x150/d3d3d3/808080?text=Sem+Capa';
        const title = book.volumeInfo.title || 'Título Desconhecido';
        const authors = book.volumeInfo.authors ? book.volumeInfo.authors.join(', ') : 'Autor Desconhecido';

        bookCard.innerHTML = `
            <img src="${imageUrl}" alt="${title}" onerror="this.onerror=null;this.src='https://via.placeholder.com/100x150/d3d3d3/808080?text=Capa+Indisponível';">
            <div class="book-info" style="display: none;">
                <h4>${title}</h4>
                <p>${authors}</p>
            </div>
        `;
        return bookCard;
    }

    // Função para preencher uma lista de livros (com carrossel)
    async function populateBookList(elementId, query, maxResults = 20) {
        const listContainer = document.getElementById(elementId);
        if (!listContainer) {
            console.warn(`Elemento com ID '${elementId}' não encontrado. Verifique o HTML.`);
            return;
        }

        const leftArrow = listContainer.querySelector('.left-arrow');
        const rightArrow = listContainer.querySelector('.right-arrow');

        // Limpa apenas os cards de livros, mantendo as setas
        Array.from(listContainer.children).forEach(child => {
            if (child.classList.contains('book-card')) { // Limpa apenas os book-cards
                child.remove();
            }
        });

        const books = await fetchBooks(query, maxResults);
        console.log(`Livros retornados para "${query}":`, books.length);

        if (books.length === 0) {
            // Se já tem as setas, limpa o meio e coloca a mensagem.
            if (leftArrow && rightArrow) {
                // Remove tudo entre as setas
                let node = leftArrow.nextSibling;
                while (node && node !== rightArrow) {
                    const nextNode = node.nextSibling;
                    node.remove();
                    node = nextNode;
                }
                // Insere a mensagem
                const msg = document.createElement('p');
                msg.style.margin = '20px';
                msg.style.textAlign = 'center';
                msg.style.flexGrow = '1'; // Para a mensagem ocupar espaço no flex
                msg.textContent = 'Nenhum livro encontrado para esta categoria.';
                listContainer.insertBefore(msg, rightArrow);
            } else {
                // Se não tem setas, limpa tudo e só coloca a mensagem (caso de não-carrossel)
                listContainer.innerHTML = '<p style="margin: 20px; text-align: center;">Nenhum livro encontrado para esta categoria.</p>';
            }
            return;
        }

        books.forEach(book => {
            if (book && book.volumeInfo) { // Garante que o objeto do livro é válido
                const bookCard = createBookCard(book);
                if (rightArrow) {
                    listContainer.insertBefore(bookCard, rightArrow);
                } else {
                    listContainer.appendChild(bookCard);
                }
            } else {
                console.warn('Livro inválido encontrado:', book);
            }
        });

        // Adiciona funcionalidade de scroll para as setas
        if (leftArrow && rightArrow) {
            // Remove listeners antigos para evitar duplicação se a função for chamada novamente
            const oldLeftArrow = leftArrow.cloneNode(true);
            const oldRightArrow = rightArrow.cloneNode(true);
            leftArrow.parentNode.replaceChild(oldLeftArrow, leftArrow);
            rightArrow.parentNode.replaceChild(oldRightArrow, rightArrow);

            oldLeftArrow.addEventListener('click', () => {
                listContainer.scrollBy({
                    left: -listContainer.clientWidth * 0.8,
                    behavior: 'smooth'
                });
            });
            oldRightArrow.addEventListener('click', () => {
                listContainer.scrollBy({
                    left: listContainer.clientWidth * 0.8,
                    behavior: 'smooth'
                });
            });
        }
    }

    // Função para preencher um grid de livros
    async function populateBookGrid(elementId, query, maxResults = 28) {
        const gridContainer = document.getElementById(elementId);
        if (!gridContainer) {
            console.warn(`Elemento com ID '${elementId}' não encontrado. Verifique o HTML.`);
            return;
        }

        gridContainer.innerHTML = ''; // Limpa todo o conteúdo para o grid

        const books = await fetchBooks(query, maxResults);
        console.log(`Livros retornados para grid "${query}":`, books.length);

        if (books.length === 0) {
            gridContainer.innerHTML = '<p style="margin: 20px; text-align: center;">Nenhum livro encontrado para esta categoria.</p>';
            return;
        }

        books.forEach(book => {
            if (book && book.volumeInfo) {
                const bookCard = createBookCard(book);
                gridContainer.appendChild(bookCard);
            } else {
                console.warn('Livro inválido encontrado para grid:', book);
            }
        });
    }

    // === FUNÇÃO PARA GERENCIAR ABAS DE NAVEGAÇÃO ===
    const navLinks = document.querySelectorAll('.main-nav .nav-link');
    const sections = {
        'catalog': document.getElementById('catalog-section'),
        'promotions': document.getElementById('promotions-section'),
        'favorites': document.getElementById('favorites-section')
    };
    const allContentSections = document.querySelectorAll('main.container > section.section'); // Seleciona todas as seções principais

    function showSection(targetId) {
        // Remove 'active' de todos os links de navegação
        navLinks.forEach(link => link.classList.remove('active'));

        // Adiciona 'active' ao link clicado
        const clickedLink = document.querySelector(`.nav-link[data-target="${targetId}"]`);
        if (clickedLink) {
            clickedLink.classList.add('active');
        }

        // Oculta todas as seções de conteúdo
        allContentSections.forEach(section => section.classList.add('hidden'));

        // Mostra a seção alvo.
        if (targetId === 'catalog') {
            document.getElementById('catalog-section').classList.remove('hidden');
            document.getElementById('highlights-section').classList.remove('hidden');
            document.getElementById('preorders-section').classList.remove('hidden');
        } else if (targetId === 'favorites') {
            document.getElementById('favorites-section').classList.remove('hidden');
            updateFavoritesSection();
        } else {
            // Para outras seções (promoções, etc.), mostre apenas a seção correspondente
            const targetSection = sections[targetId];
            if (targetSection) {
                targetSection.classList.remove('hidden');
                // Se a seção de promoções está sendo mostrada, aplica os filtros iniciais ou recarrega
                if (targetId === 'promotions') {
                    applyFilters(); // Aplica os filtros atuais (ou nenhum, se limpo)
                }
            }
        }
    }

    // Adiciona event listeners aos links de navegação
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault(); // Impede o comportamento padrão do link (recarregar a página)
            const targetId = event.target.dataset.target;
            showSection(targetId);
        });
    });

    // === FUNÇÕES DO MODAL ===
    const bookDetailsModal = document.getElementById('book-details-modal');
    const closeButton = bookDetailsModal.querySelector('.close-button');
    const modalBookImage = document.getElementById('modal-book-image');
    const modalBookTitle = document.getElementById('modal-book-title');
    const modalBookAuthors = document.getElementById('modal-book-authors');
    const modalBookPublisher = document.getElementById('modal-book-publisher');
    const modalBookPublishedDate = document.getElementById('modal-book-published-date');
    const modalBookPageCount = document.getElementById('modal-book-page-count');
    const modalBookLanguage = document.getElementById('modal-book-language');
    const modalBookDescription = document.getElementById('modal-book-description');
    const modalBookPreviewLink = document.getElementById('modal-book-preview-link');
    const addToFavoritesBtn = document.getElementById('add-to-favorites-btn');
    const removeFromFavoritesBtn = document.getElementById('remove-from-favorites-btn');
    let currentBookInModal = null;

    function openBookModal(book) {
        // Preenche o modal com as informações do livro
        currentBookInModal = book;
        const volumeInfo = book.volumeInfo;
        const imageUrl = volumeInfo.imageLinks?.extraLarge || volumeInfo.imageLinks?.large || volumeInfo.imageLinks?.medium || volumeInfo.imageLinks?.small || volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail || 'https://via.placeholder.com/200x300/d3d3d3/808080?text=Capa+Indisponível';

        modalBookImage.src = imageUrl;
        modalBookImage.alt = volumeInfo.title || 'Capa do Livro';

        modalBookTitle.textContent = volumeInfo.title || 'Título Desconhecido';
        modalBookAuthors.textContent = volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Autor Desconhecido';
        modalBookPublisher.textContent = `Editora: ${volumeInfo.publisher || 'Desconhecida'}`;
        modalBookPublishedDate.textContent = `Data de Publicação: ${volumeInfo.publishedDate || 'Desconhecida'}`;
        modalBookPageCount.textContent = `Páginas: ${volumeInfo.pageCount || 'Desconhecidas'}`;
        modalBookLanguage.textContent = `Idioma: ${volumeInfo.language ? volumeInfo.language.toUpperCase() : 'Desconhecido'}`;
        modalBookDescription.innerHTML = volumeInfo.description || 'Nenhuma descrição disponível.'; // Use innerHTML para formatar tags HTML da descrição

        // Link de preview (se disponível)
        if (book.accessInfo && book.accessInfo.webReaderLink) {
            modalBookPreviewLink.href = book.accessInfo.webReaderLink;
            modalBookPreviewLink.style.display = 'inline-block';
        } else {
            modalBookPreviewLink.href = '#';
            modalBookPreviewLink.style.display = 'none';
        }


        const isFavorite = favoriteBooks.some(favBook => favBook.id === book.id);

        if (isFavorite) {
            addToFavoritesBtn.style.display = 'none';
            removeFromFavoritesBtn.style.display = 'inline-block';
        } else {
            addToFavoritesBtn.style.display = 'inline-block';
            removeFromFavoritesBtn.style.display = 'none';
        }
        // -----------------------------------------------------------

        bookDetailsModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';


        bookDetailsModal.style.display = 'flex'; // Exibe o modal (usando flex para centralização)
        document.body.style.overflow = 'hidden'; // Evita a rolagem do corpo da página quando o modal está aberto
    }

    function closeBookModal() {
        bookDetailsModal.style.display = 'none'; // Oculta o modal
        document.body.style.overflow = 'auto'; // Restaura a rolagem do corpo da página
    }

    // Event listener para fechar o modal clicando no 'X'
    closeButton.addEventListener('click', closeBookModal);

    // Event listener para fechar o modal clicando fora do conteúdo
    window.addEventListener('click', (event) => {
        if (event.target === bookDetailsModal) {
            closeBookModal();
        }
    });

    // Event listener para fechar o modal pressionando a tecla 'Esc'
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && bookDetailsModal.style.display === 'flex') {
            closeBookModal();
        }
    });


    // === LÓGICA DE FAVORITOS ===
    let favoriteBooks = [];

    // Função para adicionar um livro aos favoritos
    function addBookToFavorites(book) {
        if (!book || !book.id) {
            console.warn("Tentativa de adicionar livro inválido aos favoritos.");
            return;
        }

        // Verifica se o livro já está nos favoritos para evitar duplicatas
        if (!favoriteBooks.some(favBook => favBook.id === book.id)) {
            favoriteBooks.push(book);
            console.log('Livro adicionado aos favoritos:', book.volumeInfo.title);
            // Atualiza a seção de favoritos
            updateFavoritesSection();
            alert(`"${book.volumeInfo.title}" foi adicionado aos seus favoritos!`);
        } else {
            console.log('Livro já está nos favoritos:', book.volumeInfo.title);
            alert(`"${book.volumeInfo.title}" já está na sua lista de favoritos.`);
        }
        closeBookModal(); // Fecha o modal após adicionar
    }

    // Função para remover um livro dos favoritos
    function removeBookFromFavorites(bookId) {
        const initialLength = favoriteBooks.length;
        favoriteBooks = favoriteBooks.filter(favBook => favBook.id !== bookId);
        if (favoriteBooks.length < initialLength) {
            console.log('Livro removido dos favoritos. ID:', bookId);
            updateFavoritesSection(); // Atualiza a seção de favoritos
            alert("Livro removido dos favoritos.");
        } else {
            console.warn("Tentativa de remover livro não encontrado nos favoritos. ID:", bookId);
            alert("Este livro não estava na sua lista de favoritos.");
        }
        closeBookModal(); // Fecha o modal após remover
    }

    // Função para atualizar a exibição da seção de favoritos
    function updateFavoritesSection() {
        const favoritesGrid = document.getElementById('favoritos-comunidade-grid');
        if (!favoritesGrid) {
            console.warn("Elemento 'favoritos-comunidade-grid' não encontrado.");
            return;
        }

        favoritesGrid.innerHTML = ''; // Limpa a seção de favoritos

        if (favoriteBooks.length === 0) {
            favoritesGrid.innerHTML = '<p style="margin: 20px; text-align: center;">Seus livros favoritos aparecerão aqui. Adicione alguns!</p>';
        } else {
            favoriteBooks.forEach(book => {
                const bookCard = createBookCard(book); // Reutiliza a função de criar card
                favoritesGrid.appendChild(bookCard);
            });
        }
        console.log('Seção de favoritos atualizada. Total de favoritos:', favoriteBooks.length);
    }

    // Event listener para o botão "Adicionar aos Favoritos"
    if (addToFavoritesBtn) {
        addToFavoritesBtn.addEventListener('click', () => {
            if (currentBookInModal) {
                addBookToFavorites(currentBookInModal);
            } else {
                console.warn("Nenhum livro selecionado no modal para adicionar aos favoritos.");
            }
        });
    }

    // Event listener para o botão "Remover dos Favoritos"
    if (removeFromFavoritesBtn) {
        removeFromFavoritesBtn.addEventListener('click', () => {
            if (currentBookInModal && currentBookInModal.id) {
                removeBookFromFavorites(currentBookInModal.id);
            } else {
                console.warn("Nenhum livro selecionado no modal para remover dos favoritos ou ID ausente.");
            }
        });
    }

    updateFavoritesSection();

    const promotionsGrid = document.getElementById('promocoes-grid');
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    const filterCheckboxes = document.querySelectorAll('.filter-sidebar input[type="checkbox"]');

    // Essa função é chamada por applyFilters depois que applyFilters faz a busca.
    function populatePromotionsGrid(booksToDisplay) {
        if (!promotionsGrid) {
            console.warn("Elemento 'promocoes-grid' não encontrado.");
            return;
        }

        promotionsGrid.innerHTML = ''; // Limpa o grid

        if (booksToDisplay.length === 0) {
            promotionsGrid.innerHTML = '<p style="margin: 20px; text-align: center;">Nenhum livro encontrado com os filtros selecionados.</p>';
            return;
        }

        booksToDisplay.forEach(book => {
            if (book && book.volumeInfo) {
                const bookCard = createBookCard(book);
                promotionsGrid.appendChild(bookCard);
            } else {
                console.warn('Livro inválido encontrado para grid de promoções:', book);
            }
        });
        console.log(`Promoções grid atualizado. Total: ${booksToDisplay.length}`);
    }

    // Função principal de filtragem
    async function applyFilters() {
        const queryTerms = [];

        const selectedCategories = Array.from(document.querySelectorAll('.filter-group input[data-filter-type="category"]:checked')).map(cb => cb.value.toLowerCase());
        const selectedPrices = Array.from(document.querySelectorAll('.filter-group input[data-filter-type="price"]:checked')).map(cb => cb.value.toLowerCase());
        const selectedLanguages = Array.from(document.querySelectorAll('.filter-group input[data-filter-type="language"]:checked')).map(cb => cb.value.toLowerCase());

        // Adicionar termos de categoria (assunto)
        if (selectedCategories.length > 0) {
            queryTerms.push(`subject:(${selectedCategories.join(' OR ')})`);
        }

        // Adicionar termos de idioma
        if (selectedLanguages.length > 0) {
            queryTerms.push(`lang:${selectedLanguages.join(',')}`);
        }

        // Se nenhum filtro de categoria ou idioma foi selecionado, adicione um termo geral
        if (queryTerms.length === 0) {
            queryTerms.push('livros'); // Termo padrão se nenhum filtro específico for aplicado
        }

        const finalQuery = queryTerms.join(' ');

        console.log("Construindo query para a API:", finalQuery);

        // Mensagem de carregamento antes de buscar
        if (promotionsGrid) { // Garante que o elemento existe antes de tentar manipular o DOM
            promotionsGrid.innerHTML = '<p style="margin: 20px; text-align: center;">Carregando livros...</p>';
        }

        const fetchedBooks = await fetchBooks(finalQuery, 28); // Faz a busca na API.

        let finalFilteredBooks = [...fetchedBooks];

        // Aplicação da filtragem de preço (simulada) APÓS a busca da API
        if (selectedPrices.length > 0) {
            finalFilteredBooks = finalFilteredBooks.filter(book => {
                const price = book.simulatedPrice || (Math.random() * 100);
                book.simulatedPrice = price;
                return selectedPrices.some(selectedPrice => {
                    if (selectedPrice === 'under20') return price <= 20;
                    if (selectedPrice === '20to50') return price > 20 && price <= 50;
                    if (selectedPrice === 'over50') return price > 50;
                    return false;
                });
            });
        }

        populatePromotionsGrid(finalFilteredBooks); // Popula o grid com os livros filtrados (e localmente por preço)
    }

    // Função para limpar todos os filtros
    async function clearFilters() {
        filterCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        // Apenas chame applyFilters, que agora gerencia a busca por 'livros' quando nenhum filtro está ativo.
        applyFilters();
    }

    // Event Listeners para os botões de filtro
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }

    // === CHAMADAS PARA PREENCHER AS SEÇÕES INICIAIS ===
    populateBookList('mais-vendidos-list', 'ficcao best-sellers', 40);
    populateBookList('destaques-list', 'fantasia populares', 40);
    populateBookList('prevendas-list', 'romance lancamento', 40);
    populateBookGrid('favoritos-comunidade-grid', 'melhores livros', 10);
    // Define a seção inicial a ser exibida (Catálogo por padrão)
    showSection('catalog'); // Esta linha garante que o "Catálogo" é o primeiro a aparecer.
                            // Quando o usuário clicar em "Promoções", `applyFilters()` será chamado.

    // --- Funcionalidade de Pesquisa ---
    const searchInput = document.querySelector('.search-bar input');
    const searchButton = document.querySelector('.search-bar button');

    if (searchButton && searchInput) {
        searchButton.addEventListener('click', async () => { // Adicionado async
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                console.log('Pesquisando por:', searchTerm);
                // Exemplo: popular a seção de destaques com a busca
                await populateBookList('destaques-list', searchTerm, 40); // Atualiza a seção de destaques

                const vendidosSection = document.getElementById('mais-vendidos-list'); // Obtenha o elemento da lista de destaques
                if (vendidosSection) {
                    vendidosSection.scrollIntoView({
                        behavior: 'smooth', // Adiciona um efeito de rolagem suave
                        block: 'start'       // Rola para o início do elemento (topo da seção)
                    });
                }
            }
        });

        searchInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                searchButton.click();
            }
        });
    }
}); // Fim do DOMContentLoaded