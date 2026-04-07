const reviewDelete = async () => {
    const proceedDelete = confirm("Delete user review?");
    if (!proceedDelete)
        return;

    const deleteReq = await fetch(`/deletereview/${establishmentId}`, {
        method: 'DELETE',
    });

    const deleteRes = await deleteReq.json();
    alert(deleteRes.message);
    window.location.reload();
}

const toggleReviewEdit = (id) => {
    const userReview = document.getElementById(id);
    if (!userReview)
        return

    const userReviewText = document.getElementsByClassName("review-comment-text")[0];
    const userReviewEditArea = document.getElementsByClassName("review-editarea")[0];

    console.log(userReviewEditArea, userReviewText)

    if (!userReviewText || !userReviewEditArea)
        return


    // Toggle editing on
    if (userReviewText.style.display != "none") {
        userReviewText.style.display = "none";
        userReviewEditArea.style.display = "block";
        userReviewEditArea.getElementsByTagName('textarea')[0].value = userReviewText.innerText
    } 
    // Toggle editing off
    else {
        userReviewText.style.display = "block";
        userReviewEditArea.style.display = "none";
    }

    let starObj = userReview.getElementsByClassName("star-rating-selector")[0].getElementsByClassName("stars")[0]
    updateReviewRating(starObj, -1);
}

const updateReviewRating = (star, rating) => {
    let starsContainer = star.parentElement
    const ratingValue = starsContainer.getElementsByClassName("rating-value")[0];
    const ratingText = starsContainer.getElementsByClassName("rating-text")[0];
    const ratingStars = starsContainer.getElementsByClassName("rating-stars");

    if (!ratingValue || !ratingText || !ratingStars)
        return console.log(ratingValue)

    if (rating < 1 || rating > 5)
        rating = ratingValue.value;

    for(i=0; i<5; i++) {
        let star = '☆'
        if (i < rating)                            
            star = '★';
        ratingStars[i].innerText = star;
    }

    ratingText.innerText = rating+"/5"
    ratingValue.value = rating

}

const saveReview = async (id) => {
    const userReview = document.getElementById(id);
    if (!userReview)
        return;

    console.log(id)

    const ratingValue = userReview.getElementsByClassName("rating-value")[0];
    const reviewBody = userReview.getElementsByClassName("review-editarea-text")[0];

    const rating = Number(ratingValue.value)
    const comment = reviewBody.value

    const editReq = await fetch(`/editreview/${establishmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({rating: rating, comment: comment}),
    })

    const editRes = await editReq.json()

    alert(editRes.message)
    toggleReviewEdit(id);

    if (editRes.status == 200) {
        let newRating = editRes.data.rating
        let newComment = editRes.data.comment

        let starsStr = ''
        for(i=0; i<5; i++) {
            let star = '☆'
            if (i < newRating)                            
                star = '★';
            starsStr += star;
        }
        userReview.getElementsByClassName("star-rating")[0].innerText = starsStr;
        userReview.getElementsByClassName("review-comment-text")[0].innerText = newComment;
    }
}

const markReview = async (e, action) => {
    // Yes it's scuffed, again, no, I won't fix this.
    const review = e.parentElement.parentElement;
    const rid = review.getAttribute('data-reviewid');

    const markReq = await fetch(`/review/${action}/${rid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });

    const markRes = await markReq.json();

    if (markRes.status == 200) {
        const newHelpfulCount = markRes.data.helpfulCount;
        const newUnhelpfulCount = markRes.data.unhelpfulCount;

        e.parentElement.getElementsByClassName('review-helpful-count')[0].innerText = newHelpfulCount;
        e.parentElement.getElementsByClassName('review-unhelpful-count')[0].innerText = newUnhelpfulCount;
    }
}

const renderStarsHTML = (rating) => {
    let innerText
    if (rating === -1) {
        innerText = "No ratings";
    } else {
        const roundedRating = Math.round(rating);
        innerText = "★".repeat(roundedRating) + "☆".repeat(5 - roundedRating);
    }

    return `<span class="stars${rating == -1 ? '-no-ratings' : ''} star-rating">${innerText}</span>`
}

function truncateReviewText(str, len, reviewId, type = "review") {
    if (typeof(str) != 'string') return str;

    if (str.length > len) {
        let truncated = str.substring(0, len);
        let lastSpace = truncated.lastIndexOf(' ');
        if (lastSpace > 0) truncated = truncated.substring(0, lastSpace);

        return `
      <span class="${type}-comment-text" 
            data-full="${str}" 
            data-truncated="${truncated}...">
        ${truncated}...
      </span>
      <span class="toggle-view" onclick="toggleView('${reviewId}', '${type}')">
        <em>View more</em>
      </span>
    `;
    }
    return str;
}

function toggleView(reviewId, type = "review") {
    const reviewEl = document.querySelector(
        `[data-reviewid="${reviewId}"] .${type}-comment-text`
    );
    const toggleEl = document.querySelector(
        `[data-reviewid="${reviewId}"] .toggle-view`
    );

    if (!reviewEl || !toggleEl) return;

    if (toggleEl.innerText.includes("more")) {
        reviewEl.textContent = reviewEl.dataset.full;
        toggleEl.innerHTML = "<em>View less</em>";
    } else {
        reviewEl.textContent = reviewEl.dataset.truncated;
        toggleEl.innerHTML = "<em>View more</em>";
    }
}

function openMediaViewer(url, captionText = '') {
    const modal = document.getElementById('media-viewer');
    const img = document.getElementById('media-viewer-img');
    const caption = document.getElementById('caption');
    img.src = url;
    caption.innerHTML = "";  // the caption text is broken, so I'll not display it 
    modal.style.display = "flex";
}

function closeMediaViewer() {
    document.getElementById('media-viewer').style.display = "none";
}

const renderMediaThumbnails = (media, reviewId) => {
    if (!media || media.length === 0) return '';

    var mediaThumbsHTML = ''
    for (let i in media) {
        m = media[i]

        mediaThumbsHTML += `
            <div class="review-media">
                    <img src="${m}" 
                        alt="media-${i}" 
                        class="review-thumbnail"
                        onclick="openMediaViewer('${m}', 'media-${i}')"/>
            </div>
        `;
    }
    return mediaThumbsHTML;
};

const createReviewHTML = (review) => {
    const ownerResponse = review.ownerResponse ? `
        <div class="review-response">
            <p> 
                <a href="/profile/${review.ownerResponse.ownerId._id}" 
                style="color:black; text-decoration:none; font-weight:bold;"
                onmouseover="this.style.color='#d14d72'; this.style.textDecoration='underline';"
                onmouseout="this.style.color='black'; this.style.textDecoration='none';">${review.ownerResponse.ownerId.username}</a>
                <span class="review-edited"><em>${review.ownerResponse.edited ? 'edited' : ''}</em></span>
                <br />
                ${truncateReviewText(review.ownerResponse.comment, 100, review._id + "-owner", "owner")}
            </p>
            <p> ${renderMediaThumbnails(review.ownerResponse.media, review._id + "-owner")} </p>
        </div>
    ` : '';


    return `
    <div class="review" data-author="${review.userId._id}" data-reviewid="${review._id}">
        <div>
            <div class="review-header">
                <span>
                    <a href="/profile/${review.userId._id}"
                       style="color:black; text-decoration:none; font-weight:bold;"
                       onmouseover="this.style.color='#d14d72'; this.style.textDecoration='underline';"
                       onmouseout="this.style.color='black'; this.style.textDecoration='none';">${review.userId.username}</a> • ${renderStarsHTML(review.rating)}
                </span>
                <span class="review-edited"><em>${review.edited ? 'edited' : ''}</em></span>
            </div>
            <p>
                ${truncateReviewText(review.comment, 100, review._id, "review")}
            </p>

            <p> ${renderMediaThumbnails(review.media, review._id)} </p>
        </div>
        <div>
            <span onclick="markReview(this, 'helpful')">
                <i class="fa-regular fa-thumbs-up"></i>
                <span class="review-helpful-count">${review.helpfulCount}</span>
            </span>
            <span onclick="markReview(this, 'unhelpful')">
                <i class="fa-regular fa-thumbs-down"></i>
                <span class="review-unhelpful-count">${review.unhelpfulCount}</span>
            </span>
        </div>

        ${ownerResponse}
    </div>
    `;
}

const createUserReviewHTML = (review) => {
    return `
    <div class="review" id="${review.userId._id}" data-author="${review.userId._id}" data-reviewid="${review._id}">
        <div style="display: flex; justify-content: space-between">
            <span>
                <a href="/profile/${review.userId._id}" 
                   style="color:black; text-decoration:none; font-weight:bold;"
                   onmouseover="this.style.color='#d14d72'; this.style.textDecoration='underline';"
                   onmouseout="this.style.color='black'; this.style.textDecoration='none';">${review.userId.username}</a> • ${renderStarsHTML(review.rating)}
            </span>
            <span>
                <span id="review-delete" onclick="reviewDelete()">
                    <i class="fa-solid fa-trash"></i>
                </span>
                <span id="review-edit" onclick="toggleReviewEdit('${review.userId._id}')">
                    <i class="fa-solid fa-pen"></i>
                </span>
            </span>
        </div>
        <div class="review-comment">
            <p class="review-comment-text">${review.comment}</p>
            <p> ${renderMediaThumbnails(review.media, review._id)} </p>
            <div class="review-editarea">
                <span class="review-rating star-rating-selector"> 
                    <input type="hidden" name="rating" class="rating-value" value="${review.rating}" autocomplete="off"/>
                    <span class="rating-text"></span>
                    <span onclick="updateReviewRating(this, 1)" class="rating-stars stars">☆</span>
                    <span onclick="updateReviewRating(this, 2)" class="rating-stars stars">☆</span>
                    <span onclick="updateReviewRating(this, 3)" class="rating-stars stars">☆</span>
                    <span onclick="updateReviewRating(this, 4)" class="rating-stars stars">☆</span>
                    <span onclick="updateReviewRating(this, 5)" class="rating-stars stars">☆</span>
                </span>
                <textarea class="review-editarea-text"></textarea>
                <button class="review-editarea-cancel" onclick="toggleReviewEdit('${review.userId._id}')">Cancel</button> 
                <button class="review-editarea-save" onclick="saveReview('${review.userId._id}')">Save</button> 
            </div>
        </div>
        <div>
            <span onclick="markReview(this, 'helpful')">
                <i class="fa-regular fa-thumbs-up"></i>
                <span class="review-helpful-count"> ${review.helpfulCount} </span>
            </span>
            <span onclick="markReview(this, 'unhelpful')">
                <i class="fa-regular fa-thumbs-down"></i>
                <span class="review-unhelpful-count"> ${review.unhelpfulCount} </span>
            </span>
        </div>
    </div>
    `
}

const renderReviews = async (rstrId, page = 1) => { 
    // no validation for count and offset here so prayge
    const count = 10
    const offset = (page - 1) * count;

    var apiUrl = `/reviews/${rstrId}?offset=${offset}&count=${count}`;
    const currentUserId = window.currentUser?._id || localStorage.getItem("userId");

    if (currentUserId) {
        apiUrl += `&viewerId=${currentUserId}`;
    }

    // Disable buttons temporarily so user doesn't spam them
    const reviewButtons = document.getElementById('reviews-page-buttons').getElementsByTagName('button');
    const backButton  = reviewButtons[0];
    const nextButton  = reviewButtons[1];
    backButton.disabled = true
    nextButton.disabled = true

    // If there is a search query
    const searchValueEl = document.getElementById('review-search-value');
    const searchQry = searchValueEl.value.trim();

    if (searchQry != '') {
        apiUrl += `&comment=${searchQry}`
    }

    const markReq = await fetch(apiUrl, {
        method: 'GET',
    });

    const revJson = await markReq.json();
    const revData = revJson.data;

    console.log(revData)

    userReview = revData?.userReview || null;
    reviews = revData?.reviews || [];
    totalCount = revData?.totalCount || reviews.length;

    const totalPages = Math.ceil(totalCount / count) || 1;
    if (page > totalPages) page = totalPages;

    // Clear all previous reviews
    const reviewsList = document.getElementById('reviews-list');
    reviewsList.innerHTML = '';

    if (userReview) 
        reviewsList.innerHTML += createUserReviewHTML(userReview)

    for (let review of reviews) {
        reviewsList.innerHTML += createReviewHTML(review);
    }

    const start = reviews.length > 0 ? offset + 1 : 0;
    const end = offset + reviews.length;

    // update reviews result count
    document.getElementById('reviews-result-count').innerText =
        reviews.length > 0
        ? `Showing ${start}–${end} of ${totalCount} reviews`
        : `No reviews found`;

    // update reviews page number result count and page number
    document.getElementById('reviews-page-number').innerText = `Page ${page}/${totalPages}`;
    document.getElementById('reviews-page').value = page;

    // update review-buttons
    backButton.disabled = page <= 1 ? true : false
    nextButton.disabled = page >= totalPages;
}

const nextPageReviews = () => {
    // runs under the assumption this will be valid
    const pageNumber = Number(document.getElementById('reviews-page').value)
    renderReviews(establishmentId, pageNumber+1)
}

const prevPageReviews = () => {
    // runs under the assumption this will be valid
    const pageNumber = Number(document.getElementById('reviews-page').value)
    renderReviews(establishmentId, pageNumber-1)
}

const searchReviews = () => {
    const searchBar = document.getElementById('review-search-bar');
    const searchQuery = searchBar?.value.trim();

    const searchValueEl = document.getElementById('review-search-value');
    searchValueEl.value = searchQuery;

    renderReviews(establishmentId, 1) // render page 1 w/ the search query
}

// const reviewsNextPage
window.addEventListener('DOMContentLoaded', (e) => {
    renderReviews(establishmentId)

    const form = document.getElementById('review-form');
    if (!form) return;

    const ratingInput = form.querySelector('.rating-value');

    form.onsubmit = function (event) {
        if (!ratingInput.value) {
            event.preventDefault();
            alert('Please select a star rating before submitting your review.');
            return false;
        }

        event.preventDefault();
        form.submit();
    };

    const stars = document.querySelectorAll('.rating-stars');
    stars.forEach((star, index) => {
        star.addEventListener('mouseover', () => {
            stars.forEach((s, i) => s.classList.toggle('hovered', i <= index));
        });
        star.addEventListener('mouseout', () => {
            stars.forEach(s => s.classList.remove('hovered'));
        });
        star.addEventListener('click', () => {
            stars.forEach((s, i) => s.classList.toggle('selected', i <= index));
        });
    });
})



