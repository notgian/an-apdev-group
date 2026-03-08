/*** Old Hardcoded Data (Keeping it here for now, but shall be removed when backend is implemented)
const establishments = [
    { 
        name: "Mendokoro Ramba", 
        rating: "★★★★★", 
        category: "Japanese", 
        location: "Makati", 
        price: "₱500-700", 
        image: "images/mendokoro-ramba.jpg",
        about: "Known for its authentic tonkotsu broth, this ramen bar offers a minimalist counter-style dining experience. Guests enjoy watching chefs prepare steaming bowls right in front of them, creating a lively and immersive atmosphere. The bold flavors and unique setup make it a favorite among ramen enthusiasts.",
        hours: "Mon–Sun: 11:00 AM – 10:00 PM"
    },
    { 
        name: "Manam Comfort Food", 
        rating: "★★★★☆", 
        category: "Filipino", 
        location: "BGC", 
        price: "₱300-600", 
        image: "images/manam-comfort-food.jpg",
        about: "This spot is famous for serving Filipino classics with a modern twist, offering both small and big portions to suit every appetite. Diners can enjoy beloved dishes like sisig and kare-kare, reimagined with creative flair. The cozy yet contemporary vibe makes it perfect for groups and family gatherings.",
        hours: "Mon–Sun: 10:00 AM – 9:00 PM"
    },
    { 
        name: "Wildflour Cafe", 
        rating: "★★★★★", 
        category: "Bakery/Cafe", 
        location: "Ortigas", 
        price: "₱700-1000", 
        image: "images/wildflour-cafe.jpg",
        about: "A trendy bakery and cafe offering artisanal breads, pastries, and international comfort food. The stylish atmosphere makes it a popular spot for brunch, coffee dates, and casual meetings. With a menu that blends global flavors and local favorites, it has become a staple in the city’s dining scene.",
        hours: "Mon–Sun: 7:00 AM – 10:00 PM"
    },
    { 
        name: "Din Tai Fung", 
        rating: "★★★★★", 
        category: "Chinese", 
        location: "SM Megamall", 
        price: "₱400-700", 
        image: "images/din-tai-fung.jpg",
        about: "World-renowned for its xiao long bao, this Taiwanese restaurant is celebrated for hand-crafted dumplings and meticulous preparation. Each dish reflects a dedication to consistency and quality, making every visit memorable. Families and foodies alike enjoy the welcoming environment and authentic flavors.",
        hours: "Mon–Sun: 10:00 AM – 9:00 PM"
    },
    { 
        name: "Gino\'s Brick Oven Pizza", 
        rating: "★★★★☆", 
        category: "Italian", 
        location: "Katipunan", 
        price: "₱500-800", 
        image: "images/ginos-brick-oven-pizza.jpg",
        about: "A casual Italian spot known for its brick oven pizzas and homemade burrata. Fresh ingredients and traditional techniques deliver rustic, flavorful dishes that keep guests coming back. With its laid-back vibe and hearty menu, it’s a favorite hangout for students and families in the area.",
        hours: "Mon–Sun: 11:00 AM – 10:00 PM"
    }
];

const restaurantReviews = {
    "Mendokoro Ramba": [
        { user: "Foodie_Carlos", rating: "★★★★★", review: "Amazing ramen, worth the wait!" },
        { user: "ManilaEats_Sophia", rating: "★★★★☆", review: "Broth is rich, but seating can be crowded." },
        { user: "Chef_Inigo", rating: "★★★★★", review: "Best Japanese dining experience in Makati." },
        { user: "CoffeeLover_Ben", rating: "★★★★☆", review: "The noodles are perfect, but expect long lines." },
        { user: "Foodie_Maria", rating: "★★★★★", review: "Authentic ramen that feels like Japan." }
    ],

    "Manam Comfort Food": [
        { user: "Chef_Inigo", rating: "★★★★★", review: "Best sisig in town, perfect for sharing." },
        { user: "Foodie_Maria", rating: "★★★★☆", review: "Great variety of Filipino classics, though service can be slow." },
        { user: "CoffeeLover_Ben", rating: "★★★★★", review: "Comfort food that hits the spot every time." },
        { user: "Foodie_Carlos", rating: "★★★★☆", review: "Portions are generous, ideal for family dining." },
        { user: "ManilaEats_Sophia", rating: "★★★★★", review: "Modern twist on Filipino favorites, beautifully presented." }
    ],

    "Wildflour Cafe": [
        { user: "Foodie_Maria", rating: "★★★★★", review: "Excellent coffee and pastries, cozy atmosphere." },
        { user: "Chef_Inigo", rating: "★★★★☆", review: "Brunch menu is creative, but portions are a bit small." },
        { user: "ManilaEats_Sophia", rating: "★★★★★", review: "Stylish interiors and consistently good food." },
        { user: "Foodie_Carlos", rating: "★★★★☆", review: "Great for meetings, but can get noisy." },
        { user: "CoffeeLover_Ben", rating: "★★★★★", review: "My go-to spot for croissants and cappuccino." }
    ],

    "Din Tai Fung": [
        { user: "Foodie_Carlos", rating: "★★★★★", review: "Xiao long bao are perfectly crafted, consistent quality." },
        { user: "CoffeeLover_Ben", rating: "★★★★☆", review: "Delicious dumplings, but expect long wait times." },
        { user: "Foodie_Maria", rating: "★★★★★", review: "Service is excellent, very welcoming staff." },
        { user: "Chef_Inigo", rating: "★★★★★", review: "Authentic Taiwanese flavors, everything tastes fresh." },
        { user: "ManilaEats_Sophia", rating: "★★★★☆", review: "Menu is extensive, but prices are a bit high." }
    ],

    "Gino's Brick Oven Pizza": [
        { user: "CoffeeLover_Ben", rating: "★★★★★", review: "Authentic brick oven pizza, fresh ingredients." },
        { user: "Foodie_Maria", rating: "★★★★☆", review: "Great crust, though toppings can be a bit limited." },
        { user: "Chef_Inigo", rating: "★★★★★", review: "Best Margherita pizza I’ve had in Manila." },
        { user: "ManilaEats_Sophia", rating: "★★★★☆", review: "Casual vibe, perfect for group hangouts." },
        { user: "Foodie_Carlos", rating: "★★★★★", review: "Chewy crust, flavorful sauce, and generous cheese." }
    ]
};
***/

function redirectSearch() {
    const query = document.getElementById("search-input").value.trim();
    if (!query) return alert("Please enter a search term.");
    window.location.href = `search.html?query=${encodeURIComponent(query)}&mode=global`;
}

function redirectFindLocal() {
    const query = document.getElementById("find-input").value.trim();
    const location = document.getElementById("local-input").value.trim();
    if (!query) return alert("Please enter what you’re searching for.");
    window.location.href = `search.html?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&mode=local`;
}

/*** Removed loadData() ***/ 

function checkLoginStatus() {
    const loggedOutView = document.getElementById('logged-out-view');
    const loggedInView = document.getElementById('logged-in-view');

    // Check our simulated "database"
    const status = localStorage.getItem('isLoggedIn');
    const savedName = localStorage.getItem('username');
    const savedDesc = localStorage.getItem('description');

    // Only run if we are on the Profile page (where these views exist)
    if (loggedOutView && loggedInView) {
        if (status === 'true') {
            loggedOutView.style.display = 'none';
            loggedInView.style.display = 'block';

            document.getElementById('username-display').innerText = savedName;
            document.getElementById('user-desc').innerText = savedDesc || "No description provided.";
        } else {
            loggedOutView.style.display = 'flex';
            loggedInView.style.display = 'none';
        }
    }
}

function simulateSignUp() {
    const username = document.getElementById('signup-username').value;
    const description = document.getElementById('signup-desc').value;

    if(username) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', username);
        localStorage.setItem('description', description);

        // Use a small delay to ensure storage is set before redirecting
        setTimeout(() => {
            window.location.href = 'home.html';
        }, 100);
    } else {
        alert("Please enter a username!");
    }
}
function simulateLogin() {
    // 1. Get the username value
    const userField = document.getElementById('login-username').value;

    // 2. FIXED: Match the ID "remember-check" from your HTML
    const rememberCheckbox = document.getElementById('remember-check');
    const rememberMe = rememberCheckbox ? rememberCheckbox.checked : false;

    if (userField) {
        // Save state to LocalStorage as required for Phase 1
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', userField);

        // Phase 1 Requirement: "Remember" logic for 3 weeks
        if (rememberMe) {
            localStorage.setItem('rememberUntil', '21-days-simulated');
        }

        // 3. Redirect to the logged-in home page
        window.location.href = 'home.html';
    } else {
        alert("Please enter your credentials.");
    }
}

function logout() {
    // 1. Clear all stored user data (Simulating session clearance)
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('description');
    localStorage.removeItem('rememberUntil'); // Clears the 3-week period

    // 2. Alert the user (Optional, for UX)
    alert("You have been logged out.");

    // 3. Redirect to the Guest Home Page
    window.location.href = 'index.html';
}

// Function to run when the edit page loads
function loadCurrentData() {
    const savedDesc = localStorage.getItem('description');
    const descField = document.getElementById('edit-desc');

    if (descField && savedDesc) {
        descField.value = savedDesc;
    }
}

function saveProfileChanges() {
    const newDesc = document.getElementById('edit-desc').value;

    // Update our simulated "database"
    localStorage.setItem('description', newDesc);

    alert("Profile updated successfully!");
    window.location.href = 'profile.html';
}

// Update your existing window.onload
window.onload = function() {
    /*** Removed the call to loadData() here ***/
    if (typeof checkLoginStatus === "function") checkLoginStatus();
    if (document.getElementById('edit-profile-form')) loadCurrentData();
};

function normalizeName(name) {
    // Remove apostrophes and other special characters, keep only letters, numbers, and spaces
    let newName = name.replace(/[^a-zA-Z0-9 ]/g, "");
    newName = newName.replace(/[\s]+/g,"")
    return newName;
}

// For redirecting to the establishment page
function goToEstablishment(name) {
    const safeName = normalizeName(name);
    window.location.href = `establishment.html?name=${encodeURIComponent(safeName)}`;
}

document.addEventListener("DOMContentLoaded", () => {
    /*** Removed Search Page rendering logic (to be handled with search route and search.hbs) ***/

    /*** Removed Establishment Page rendering logic (to be handled with establishment route and establishment.hbs) ***/
    // Reviews interactivity
    const reviewsList = document.getElementById("reviews-list");
    let visibleReviews = 2;

    // Add review form
    if (document.getElementById("review-form")) {
        document.getElementById("review-form").addEventListener("submit", e => {
            e.preventDefault();
            const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
            const user = localStorage.getItem("username");
            const text = document.getElementById("review-text").value.trim();

            if (!isLoggedIn) {
                alert("You need to log in first to add a review.");
                return;
            }

            if (user && text) {
                // Show confirmation
                const msg = document.createElement("div");
                msg.textContent = "Review posted!";
                msg.className = "review-confirm";
                document.getElementById("review-form").appendChild(msg);
                setTimeout(() => msg.remove(), 2000);

                // Clear field
                document.getElementById("review-text").value = "";
            }
        });
    }

    // View More / View Less toggle
    const viewBtn = document.getElementById("view-more-btn");
    if (viewBtn && reviewsList) {
        viewBtn.addEventListener("click", () => {
            const allReviews = reviewsList.querySelectorAll("p");
            if (visibleReviews < allReviews.length) {
                visibleReviews = allReviews.length;
                allReviews.forEach(r => r.style.display = "block");
                viewBtn.textContent = "View Less";
            } else {
                visibleReviews = 2;
                allReviews.forEach((r, i) => r.style.display = i < 2 ? "block" : "none");
                viewBtn.textContent = "View More";
            }
        });
    }

    // Profile page
    if (document.getElementById("logged-out-view") || document.getElementById("logged-in-view")) {
        checkLoginStatus();
    } 
    // Edit profile page
    if (document.getElementById("edit-profile-form")) {
        loadCurrentData();
    }
});

/*** Removed review rendering logic (to be handled in establishment.hbs) ***/
