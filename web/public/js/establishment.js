const reviewDelete = async () => {
        const proceedDelete = confirm("Delete user review?")
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

    const userReviewText = userReview.getElementsByClassName("review-comment-text")[0];
    const userReviewEditArea = userReview.getElementsByClassName("review-editarea")[0];

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
    console.log(starsContainer)
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

    const ratingValue = userReview.getElementsByClassName("rating-value")[0];
    const reviewBody = userReview.getElementsByClassName("review-editarea-text")[0];

    const rating = Number(ratingValue.value)
    const comment = reviewBody.value

    const editReq = await fetch('/editreview/{{establishment._id}}', {
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

const createReviewHTML = (review) => {
    const ownerResponse = review.ownerResponse ? `
        <div class="review-response">
            <p> 
                <strong>${review.ownerResponse.ownerId.username} </strong> <br />
                ${review.ownerResponse.comment}
            </p>
        </div>
    ` : '';

    return `
    <div class="review" data-author="${review.userId._id}" data-reviewid="${review._id}">
        <div>
            <strong>${review.userId.username}</strong> • ${renderStarsHTML(review.rating)}
            <p>${review.comment}</p>
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
        
        ${ownerResponse}
    </div>
    `;
}

const createUserReviewHTML = (review) => {
    return `
    <div class="review" id="${review.userId._id}" data-author="${review.userId._id}" data-reviewid="${review._id}">
        <div style="display: flex; justify-content: space-between">
            <span>
                <strong>${review.userId.username}</strong> • ${renderStarsHTML(review.rating)}
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

const renderReviews = async (rstrId, count=10, offset=0) => {
    // Clear all previous reviews
    const reviewsList = document.getElementById('reviews-list');
    reviewsList.innerHTML = '';

    const markReq = await fetch(`/reviews/${rstrId}`, {
        method: 'GET',
    });
    const revJson = await markReq.json();
    const revData = revJson.data;
    console.log(revData)

    const userReview = revData?.userReview;
    const reviews = revData?.reviews;
    console.log(reviews)

    if (userReview) 
        reviewsList.innerHTML += createUserReviewHTML(userReview)

    for (let review of reviews) {
        reviewsList.innerHTML += createReviewHTML(review);
    }

}

window.addEventListener('DOMContentLoaded', (e) => {
    renderReviews(establishmentId)
})


