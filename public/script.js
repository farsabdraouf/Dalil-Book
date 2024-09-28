const API_URL = 'http://localhost:3000';
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const booksContainer = document.getElementById('booksContainer');
const loadingMessage = document.getElementById('loadingMessage');
const errorMessage = document.getElementById('errorMessage');
const bookDetailsModal = document.getElementById('bookDetailsModal');
const closeModalButton = document.getElementById('closeModal');

searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query) {
        hideSuggestions(); // إخفاء نافذة الاقتراحات عند الضغط على زر البحث
        await searchBooks(query);
    }
});


closeModalButton.addEventListener('click', () => {
    bookDetailsModal.classList.add('hidden');
});

bookDetailsModal.addEventListener('click', (e) => {
    if (e.target === bookDetailsModal) {
        bookDetailsModal.classList.add('hidden');
    }
});

async function searchBooks(query) {
    showLoading(true);
    hideError();
    try {
        const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('فشل في جلب البيانات');
        const books = await response.json();
        displayBooks(books);
    } catch (err) {
        showError('حدث خطأ أثناء البحث عن الكتب. تأكد من تشغيل الخادم المحلي على المنفذ 3000.');
    } finally {
        showLoading(false);
    }
}

searchInput.addEventListener('input', async () => {
    const query = searchInput.value.trim();
    if (query.length >= 2) { // لبدء الاقتراح بعد كتابة حرفين أو أكثر
        await fetchAutocomplete(query);
    }
});

async function fetchAutocomplete(query) {
    try {
        const response = await fetch(`${API_URL}/autocomplete?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('فشل في جلب الاقتراحات');
        const suggestions = await response.json();
        //console.log('Suggestions:', suggestions); // تحقق من هيكل البيانات هنا
        displaySuggestions(suggestions);
    } catch (err) {
        console.error('Error fetching autocomplete suggestions:', err);
    }
}


function displaySuggestions(suggestions) {
    const suggestionBox = document.getElementById('suggestionsBox');
    suggestionBox.innerHTML = ''; // تفريغ الاقتراحات السابقة
    suggestions.forEach(suggestion => {
        const suggestionItem = document.createElement('div');

        // استخدام الحقل 'label' لعرض الاقتراح
        suggestionItem.textContent = suggestion.label || 'عنوان غير معروف';
        suggestionItem.classList.add('suggestion-item');

        // إضافة حدث النقر للبحث عن الكتاب
        suggestionItem.addEventListener('click', () => {
            searchInput.value = suggestion.label;
            searchBooks(suggestion.label); // البحث عند اختيار الاقتراح
            hideSuggestions(); // إخفاء نافذة الاقتراحات بعد الاختيار
        });

        suggestionBox.appendChild(suggestionItem);
    });
}

function hideSuggestions() {
    const suggestionBox = document.getElementById('suggestionsBox');
    suggestionBox.innerHTML = ''; // تفريغ الاقتراحات وإخفاءها
}



function displayBooks(books) {
    booksContainer.innerHTML = '';
    if (books.length === 0) {
        booksContainer.innerHTML = '<p class="text-center col-span-full text-gray-400">لم يتم العثور على كتب. حاول استخدام كلمات بحث مختلفة.</p>';
        return;
    }
    books.forEach((book, index) => {
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card p-4 cursor-pointer fade-in';
        bookCard.style.animationDelay = `${index * 0.1}s`;
        bookCard.innerHTML = `
            <img src="${book.imageUrl ? `/proxy-image?url=${encodeURIComponent(book.imageUrl)}` : '/api/placeholder/200/300'}" alt="${book.title}" class="book-image mb-4">
            <h3 class="text-xl font-semibold mb-2 text-blue-300">${book.title}</h3>
            <p class="text-gray-400">المؤلف: ${book.author}</p>
        `;
        bookCard.addEventListener('click', () => fetchBookDetails(book.link));
        booksContainer.appendChild(bookCard);
    });
}

async function fetchBookDetails(bookUrl) {
    showLoading(true);
    hideError();
    try {
        const response = await fetch(`${API_URL}/book?url=${encodeURIComponent(bookUrl)}`);
        if (!response.ok) throw new Error('فشل في جلب تفاصيل الكتاب');
        const book = await response.json();
        displayBookDetails(book);
    } catch (err) {
        showError('حدث خطأ أثناء جلب تفاصيل الكتاب. تأكد من تشغيل الخادم المحلي على المنفذ 3000.');
    } finally {
        showLoading(false);
    }
}

function displayBookDetails(book) {
    // تحديث مصدر الصورة لاستخدام الـ proxy
    const imageUrl = book.imageUrl 
        ? `/proxy-image?url=${encodeURIComponent(book.imageUrl)}` 
        : '/api/placeholder/200/300';
    
    document.getElementById('bookImage').src = imageUrl;
    document.getElementById('bookImage').onerror = function() {
        this.src = '/api/placeholder/200/300';
    };

    // تعيين النص مرة واحدة لكل عنصر
    document.getElementById('bookTitle').textContent = book.title;
    document.getElementById('bookAuthor').textContent = book.author;
    document.getElementById('bookCategory').textContent = book.category;
    document.getElementById('bookPages').textContent = book.pages;
    document.getElementById('bookLanguage').textContent = book.language;
    document.getElementById('bookSize').textContent = book.size;
    document.getElementById('bookFileType').textContent = book.fileType;
    document.getElementById('bookDescription').textContent = book.description;

    // عرض نافذة التفاصيل
    bookDetailsModal.classList.remove('hidden');
    bookDetailsModal.classList.add('fade-in');
}


function showLoading(show) {
    loadingMessage.classList.toggle('hidden', !show);
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

function hideError() {
    errorMessage.classList.add('hidden');
}

// الحصول على عناصر الزر
const scrollToTopButton = document.getElementById('scrollToTopButton');

// إضافة حدث عند التمرير في الصفحة
window.addEventListener('scroll', () => {
    // إظهار الزر عندما تنزل 300px من أعلى الصفحة
    if (window.scrollY > 300) {
        scrollToTopButton.classList.add('show');
    } else {
        scrollToTopButton.classList.remove('show');
    }
});

// إضافة حدث عند الضغط على الزر للصعود إلى أعلى الصفحة ببطء
scrollToTopButton.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth' // الحركة سلسة
    });
});