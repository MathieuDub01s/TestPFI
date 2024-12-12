function createTimeoutPopup() {
    $('body').append(`
        <div class='popup' id="popup"> 
            <div class='popupContent'>
                <div>
                    <div class='popupHearder'> Attention!</div> 
                    <h4 id='popUpMessage'></h4>
                </div>
                <div onclick='closePopup(); ' class='close-btn fa fa-close'></div> 
            </div>
           
        </div> 
    `);
}
let currentTimeouID = undefined;
let initialized = false;
let timeBeforeRedirect = 5;
let timeoutCallBack = () => {
    (async () => {
        const response = await Posts_API.Logout();
        if (response) {
            noTimeout(Posts_API.retrieveLoggedUser().Id);
        } else {
            $('#errorFactor').html(`${Posts_API.currentHttpError}`);
        }
    }
    )();
    renderLogin("Votre session est expirée. Veuillez vous reconnecter.");
    noTimeout();
};
let infinite = -1;
let timeLeft = infinite;
let maxStallingTime = infinite;

function initTimeout(stallingTime = infinite, callback = timeoutCallBack) {
    maxStallingTime = stallingTime;
    timeoutCallBack = callback;
    createTimeoutPopup();
    initialized = true;
}
function noTimeout() {
    $(".popup").hide();
    $('#popup').remove();
    clearTimeout(currentTimeouID);
}
function timeout(iddleTime = 0) {
    if (iddleTime != 0)
        maxStallingTime = iddleTime;
    startCountdown();
}
function startCountdown() {
    if (!initialized) initTimeout();
    clearTimeout(currentTimeouID);
    $(".popup").hide();
    timeLeft = maxStallingTime;
    if (timeLeft != infinite) {
        currentTimeouID = setInterval(() => {
            timeLeft = timeLeft - 1;
            if (timeLeft > 0) {
                if (timeLeft <= 10) {
                    $(".popup").show();
                    $("#popUpMessage").text("Expiration dans " + timeLeft + " secondes");
                }
            } else {
                $("#popUpMessage").text('Redirection dans ' + (timeBeforeRedirect + timeLeft) + " secondes");
                if (timeLeft <= -timeBeforeRedirect) {
                    clearTimeout(currentTimeouID);
                    closePopup();
                    timeoutCallBack();
                }
            }
        }, 1000);
    }
}
function closePopup() {
    $(".popup").hide();
    startCountdown();
} 