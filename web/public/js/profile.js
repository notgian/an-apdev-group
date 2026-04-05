const followUser = async (tofollowId) => {
    console.log(tofollowId)

    const followReq = await fetch(`/follow/${tofollowId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    })

    if (followReq.status == 204) {
        alert('User followed successfully!');
        window.location.reload();
        return;
    }
    else
        alert('Could not follow user...');
}
