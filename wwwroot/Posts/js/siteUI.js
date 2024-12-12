////// Author: Nicolas Chourot
////// 2024
//////////////////////////////

const periodicRefreshPeriod = 10;
const waitingGifTrigger = 2000;
const minKeywordLenth = 3;
const keywordsOnchangeDelay = 500;

let categories = [];
let selectedCategory = "";
let currentETag = "";
let periodic_Refresh_paused = false;
let postsPanel;
let itemLayout;
let waiting = null;
let showKeywords = false;
let keywordsOnchangeTimger = null;
let usersPanel;

Init_UI();
async function Init_UI() {
    postsPanel = new PageManager('postsScrollPanel', 'postsPanel', 'postSample', renderPosts);

    $('#createPost').on("click", async function () {
        showCreatePostForm();
    });
    $('#abort').on("click", async function () {
        $('#newAccountContainer').empty();
        $('#usersPanel').empty();
        showPosts();
    });
    $('#aboutCmd').on("click", function () {
        showAbout();
    });
    $("#showSearch").on('click', function () {
        toogleShowKeywords();
        showPosts();
    });

    $('#DDMenu').on('click', '#loginCMD', function () {
        renderLogin("");
    });
    $('#DDMenu').on('click', '#logoutCMD', function (event) {
        event.preventDefault();
        (async () => {
            const response = await Posts_API.Logout();

            if (response) {
                noTimeout(Posts_API.retrieveLoggedUser().Id);
                showPosts();
            } else {
                $('#errorFactor').html(`${Posts_API.currentHttpError}`);
            }
        }
        )();
        Posts_API.eraseAccessToken();
        Posts_API.eraseLoggedUser();
        noTimeout();
        showPosts();
    });

    $('#DDMenu').on('click', '#gestionUserCMD', function () {
        periodic_Refresh_paused = true;
        usersPanel = new PageManager('usersScrollPanel', 'usersPanel', 'userSample', renderUsers);
        renderUsers();
    });
    $('#DDMenu').on('click', '#updateProfileCMD', function () {
        renderNewAccount(Posts_API.retrieveLoggedUser());
    });
    $('#DDMenu').on('click', '#userCMD', function () {
        renderNewAccount(Posts_API.retrieveLoggedUser());
    });
    installKeywordsOnkeyupEvent();
    await showPosts();
    start_Periodic_Refresh();
}

/////////////////////////// Search keywords UI //////////////////////////////////////////////////////////

function installKeywordsOnkeyupEvent() {
    $("#searchKeys").on('keyup', function () {
        clearTimeout(keywordsOnchangeTimger);
        keywordsOnchangeTimger = setTimeout(() => {
            cleanSearchKeywords();
            showPosts(true);
        }, keywordsOnchangeDelay);
    });
    $("#searchKeys").on('search', function () {
        showPosts(true);
    });
}
function cleanSearchKeywords() {
    /* Keep only keywords of 3 characters or more */
    let keywords = $("#searchKeys").val().trim().split(' ');
    let cleanedKeywords = "";
    keywords.forEach(keyword => {
        if (keyword.length >= minKeywordLenth) cleanedKeywords += keyword + " ";
    });
    $("#searchKeys").val(cleanedKeywords.trim());
}
function showSearchIcon() {
    $("#hiddenIcon").hide();
    $("#showSearch").show();
    if (showKeywords) {
        $("#searchKeys").show();
    }
    else
        $("#searchKeys").hide();
}
function hideSearchIcon() {
    $("#hiddenIcon").show();
    $("#showSearch").hide();
    $("#searchKeys").hide();
}
function toogleShowKeywords() {
    showKeywords = !showKeywords;
    if (showKeywords) {
        $("#searchKeys").show();
        $("#searchKeys").focus();
    }
    else {
        $("#searchKeys").hide();
        showPosts(true);
    }
}

/////////////////////////// Views management ////////////////////////////////////////////////////////////

function intialView() {
    let loggedUser = Posts_API.retrieveLoggedUser();
    $("#createPost").hide();
    if (loggedUser != null) {
        if (loggedUser.Authorizations.writeAccess == 2) {
            $("#createPost").show();
        } else {
            $("#createPost").hide();
        }
    }
    $("#hiddenIcon").hide();
    $("#hiddenIcon2").hide();
    $('#menu').show();
    $('#commit').hide();
    $('#abort').hide();
    $('#form').hide();
    $('#form').empty();
    $('#aboutContainer').hide();
    $('#errorContainer').hide();
    showSearchIcon();
}
async function showPosts(reset = false) {
    intialView();
    $("#viewTitle").text("Fil de nouvelles");
    periodic_Refresh_paused = false;
    await postsPanel.show(reset);
}
function hidePosts() {
    postsPanel.hide();
    hideSearchIcon();
    $("#createPost").hide();
    $('#menu').hide();
    periodic_Refresh_paused = true;
}
function showForm() {
    hidePosts();
    $('#form').show();
    $('#commit').show();
    $('#abort').show();
}
function showError(message, details = "") {
    hidePosts();
    $('#form').hide();
    $('#form').empty();
    $("#hiddenIcon").show();
    $("#hiddenIcon2").show();
    $('#commit').hide();
    $('#abort').show();
    $("#viewTitle").text("Erreur du serveur...");
    $("#errorContainer").show();
    $("#errorContainer").empty();
    $("#errorContainer").append($(`<div>${message}</div>`));
    $("#errorContainer").append($(`<div>${details}</div>`));
}

function showCreatePostForm() {
    showForm();
    $("#viewTitle").text("Ajout de nouvelle");
    renderPostForm();
}
function showEditPostForm(id) {
    showForm();
    $("#viewTitle").text("Modification");
    renderEditPostForm(id);
}
function showDeletePostForm(id) {
    showForm();
    $("#viewTitle").text("Retrait");
    renderDeletePostForm(id);
}
function showAbout() {
    hidePosts();
    $("#hiddenIcon").show();
    $("#hiddenIcon2").show();
    $('#abort').show();
    $("#viewTitle").text("À propos...");
    $("#aboutContainer").show();
}

//////////////////////////// Posts rendering /////////////////////////////////////////////////////////////

//////////////////////////// Posts rendering /////////////////////////////////////////////////////////////

function start_Periodic_Refresh() {
    setInterval(async () => {
        if (!periodic_Refresh_paused) {
            let etag = await Posts_API.HEAD();
            if (currentETag != etag) {
                currentETag = etag;
                await showPosts();
            }
        }
    },
        periodicRefreshPeriod * 1000);
}

async function renderPosts(queryString, loggedUser=Posts_API.retrieveLoggedUser()) {
    if (Posts_API.retrieveLoggedUser() != null) {
        if (Posts_API.retrieveLoggedUser().VerifyCode === 'unverified') {
            $('#abort').show();
            $("#viewTitle").text("Connexion");
            hidePosts();
            $('#loginContainer').empty();
            $("#verifyUser").show();
            $("#verifyUser").empty();
            $("#verifyUser").append(`  
                <div class="format-form" id="formVerify">
                <strong>Veuillez entrer le code de vérification que vous avez reçu par courriel</strong>
                <input 
                    class="form-control"
                    name="Verify" 
                    id="Verify" 
                    placeholder="Code de vérification de courriel"
                    required
                />
                <input type="submit" value="Vérifier" id="verifyThisUser" class="btn btn-primary">
                </div>`);
        }
    }
    let endOfData = false;
    queryString += "&sort=date,desc";
    compileCategories();
    if (selectedCategory != "") queryString += "&category=" + selectedCategory;
    if (showKeywords) {
        let keys = $("#searchKeys").val().replace(/[ ]/g, ',');
        if (keys !== "")
            queryString += "&keywords=" + $("#searchKeys").val().replace(/[ ]/g, ',')
    }
    addWaitingGif();
    let response = await Posts_API.GetQuery(queryString);
    if (!Posts_API.error) {
        currentETag = response.ETag;
        currentPostsCount = parseInt(currentETag.split("-")[0]);
        let Posts = response.data;
        let likes = await Likes_API.Get();
       
        if (Posts.length > 0) {
            for (let Post of Posts) {
              //  postsPanel.itemsPanel.append(renderPost(Post));
                let like = likes.data.find(like => like.PostId === Post.Id);
                let isLikedByLoggedUser = like && loggedUser!=null && like.UsersLikesList.includes(loggedUser.Id);
                let usersLikeNames = [];
                let allUsersNames =await Posts_API.GetUserName();
                
                if (!Posts_API.error && Array.isArray(allUsersNames.data) && like && like.UsersLikesList) { 
                    allUsersNames = allUsersNames.data;
                    usersLikeNames.push(allUsersNames.filter(user => like.UsersLikesList.includes(user.UserId)).map(user => user.Name));
                    
                }
                
                let usersNamesString = usersLikeNames.join('\n');
                let usersNamesString2 = usersNamesString.replace(',', '\n')
                postsPanel.itemsPanel.append(renderPost(Post, like, isLikedByLoggedUser,  usersNamesString2));
                
            }
        } else
            endOfData = true;
        linefeeds_to_Html_br(".postText");
        highlightKeywords();
        attach_Posts_UI_Events_Callback();
    } else {
        showError(Posts_API.currentHttpError);
    }
    removeWaitingGif();
    return endOfData;
}
$('#verifyUser').on('click', '#verifyThisUser', function (event) {
    event.preventDefault();
    (async () => {
        const email = $('#Verify').val();
        try {
            const response = await Posts_API.verifyUser(email);
            console.log('API Response:', response);
            if(!Posts_API.error){
                $('#verifyUser').empty();
            }
        } catch (error) {
            console.error('Error:', error);
        }
    })();
});
async function getUserInfo(userId) {
    let user = await Posts_API.GetUserName(userId);
    if (!Posts_API.error) {
        return user.data;
    }
}
async function getUsersNames(usersLikesList) {
    let usersNames = [];
    for (let userId of usersLikesList) {
        let userInfo = await getUserInfo(userId);
        if (userInfo) {
            usersNames.push(userInfo.Name);
        }
    }
    return usersNames;
}
function renderPost(post,like, isLikedByLoggedUser, usersNames,loggedUser = Posts_API.retrieveLoggedUser()) {
    let date = convertToFrenchDate(UTC_To_Local(post.Date));
    let crudIcon = '';
    
    if (loggedUser != null) {
            if (post.Creator == loggedUser.Id && loggedUser.Authorizations.writeAccess > 1) {
                crudIcon =
                    `
                    <span class="editCmd cmdIconSmall fa fa-pencil" postId="${post.Id}" title="Modifier nouvelle"></span>
                    <span class="deleteCmd cmdIconSmall fa fa-trash" postId="${post.Id}" title="Effacer nouvelle"></span>
                    `;
            }else{
                crudIcon +=
                        `
                <span></span>
                <span></span>
                `;
            }
            if (loggedUser.Authorizations.writeAccess > 2) {
                crudIcon =
                    `
                <span></span>
                <span class="deleteCmd cmdIconSmall fa fa-trash" postId="${post.Id}" title="Effacer nouvelle"></span>
                `;
            }
            if (isLikedByLoggedUser) {  //est liker par loggedUser

                crudIcon += `<span  title='${usersNames}'class="LikeCmd cmdIconSmall fa-solid fa-thumbs-up" postId="${post.Id}" title="J'aime"></span> <span>${like.Likes}</span>`;
            } else if (!isLikedByLoggedUser && like != null) { //est liker par des gens sauf loggedUser
                crudIcon += `<span title='${usersNames}'class="LikeCmd cmdIconSmall fa-regular fa-thumbs-up" postId="${post.Id}" title="J'aime"></span> <span>${like.Likes}</span>`;
            }
            else {  //n'est pas liker
                crudIcon += `<span title='${usersNames}' class="LikeCmd cmdIconSmall fa-regular fa-thumbs-up" postId="${post.Id}" title="J'aime"></span> <span>0</span>`;
            }

    }
    return $(`
        <div class="post" id="${post.Id}">
            <div class="postHeader">
                ${post.Category}
                ${crudIcon}
            </div>
            <div class="postTitle"> ${post.Title} </div>
            <img class="postImage" src='${post.Image}'/>
            <div class="postDate"> ${date} </div>
            <div postId="${post.Id}" class="postTextContainer hideExtra">
                <div class="postText" >${post.Text}</div>
            </div>
            <div class="postfooter">
                <span postId="${post.Id}" class="moreText cmdIconXSmall fa fa-angle-double-down" title="Afficher la suite"></span>
                <span postId="${post.Id}" class="lessText cmdIconXSmall fa fa-angle-double-up" title="Réduire..."></span>
            </div>         
        </div>
    `);
}
async function compileCategories() {
    categories = [];
    let response = await Posts_API.GetQuery("?fields=category&sort=category");
    if (!Posts_API.error) {
        let items = response.data;
        if (items != null) {
            items.forEach(item => {
                if (!categories.includes(item.Category))
                    categories.push(item.Category);
            })
            if (!categories.includes(selectedCategory))
                selectedCategory = "";
            updateDropDownMenu(categories);
        }
    }
}
function updateDropDownMenu() {
    let DDMenu = $("#DDMenu");
    let selectClass = selectedCategory === "" ? "fa-check" : "fa-fw";
    DDMenu.empty();
    let loggedUser = Posts_API.retrieveLoggedUser();

    if (loggedUser != null) {
        let isAdmin = loggedUser.isAdmin;
        DDMenu.append($(`
            <div class="dropdown-item menuItemLayout" id="userCMD">
                <img src="${loggedUser.Avatar}" class="UserAvatarXSmall"/>
                <span class="username">${loggedUser.Name}</span>
            </div>
            `));
        DDMenu.append($(`<div class="dropdown-divider"></div> `));

        if (isAdmin) {
            DDMenu.append($(`
                <div class="dropdown-item menuItemLayout" id="gestionUserCMD">
                    <i class="menuIcon fa fa-user-gear mx-2"></i> Gestion des usagers
                </div>
                `));
            DDMenu.append($(`<div class="dropdown-divider"></div> `));

        }
        DDMenu.append($(`
            <div class="dropdown-item menuItemLayout" id="updateProfileCMD">
                <i class="menuIcon fa fa-user-pen mx-2"></i> Modifier votre profil
            </div>
            `));
       
        DDMenu.append($(`
            <div class="dropdown-item menuItemLayout" id="logoutCMD">
                <i class="menuIcon fa fa-sign-out mx-2"></i> Déconnexion
            </div>
            `));
    } else {

        DDMenu.append($(`
        <div class="dropdown-item menuItemLayout" id="loginCMD">
            <i class="menuIcon fa fa-sign-in mx-2"></i> Connexion
        </div>
        `));
    }
    DDMenu.append($(`<div class="dropdown-divider"></div> `));
    DDMenu.append($(`
        <div class="dropdown-item menuItemLayout" id="allCatCmd">
            <i class="menuIcon fa ${selectClass} mx-2"></i> Toutes les catégories
        </div>
        `));
    DDMenu.append($(`<div class="dropdown-divider"></div>`));
    categories.forEach(category => {
        selectClass = selectedCategory === category ? "fa-check" : "fa-fw";
        DDMenu.append($(`
            <div class="dropdown-item menuItemLayout category" id="allCatCmd">
                <i class="menuIcon fa ${selectClass} mx-2"></i> ${category}
            </div>
        `));
    })
    DDMenu.append($(`<div class="dropdown-divider"></div> `));
    DDMenu.append($(`
        <div class="dropdown-item menuItemLayout" id="aboutCmd">
            <i class="menuIcon fa fa-info-circle mx-2"></i> À propos...
        </div>
        `));
    $('#aboutCmd').on("click", function () {
        showAbout();
    });
    $('#allCatCmd').on("click", async function () {
        selectedCategory = "";
        await showPosts(true);
        updateDropDownMenu();
    });
    $('.category').on("click", async function () {
        selectedCategory = $(this).text().trim();
        await showPosts(true);
        updateDropDownMenu();
    });
    $('')
}
function attach_Posts_UI_Events_Callback() {

    linefeeds_to_Html_br(".postText");
    // attach icon command click event callback
    $(".editCmd").off();
    $(".editCmd").on("click", function () {
        showEditPostForm($(this).attr("postId"));
    });
    $(".deleteCmd").off();
    $(".deleteCmd").on("click", function () {
        showDeletePostForm($(this).attr("postId"));
    });
    $(".moreText").off();
    $(".moreText").click(function () {
        $(`.commentsPanel[postId=${$(this).attr("postId")}]`).show();
        $(`.lessText[postId=${$(this).attr("postId")}]`).show();
        $(this).hide();
        $(`.postTextContainer[postId=${$(this).attr("postId")}]`).addClass('showExtra');
        $(`.postTextContainer[postId=${$(this).attr("postId")}]`).removeClass('hideExtra');
    })
    $(".lessText").off();
    $(".lessText").click(function () {
        $(`.commentsPanel[postId=${$(this).attr("postId")}]`).hide();
        $(`.moreText[postId=${$(this).attr("postId")}]`).show();
        $(this).hide();
        $(`.postTextContainer[postId=${$(this).attr("postId")}]`).addClass('hideExtra');
        $(`.postTextContainer[postId=${$(this).attr("postId")}]`).removeClass('showExtra');
    })
    $(".LikeCmd").off();
    $(".LikeCmd").click(function (event) {
        if ($(this).hasClass("fa-solid")) {  //Si la personne a déjà liker cette photo
            likeClick($(this).attr("postId"), event, true);
        } else {
            likeClick($(this).attr("postId"), event)
        }
    })
}
function addWaitingGif() {
    clearTimeout(waiting);
    waiting = setTimeout(() => {
        postsPanel.itemsPanel.append($("<div id='waitingGif' class='waitingGifcontainer'><img class='waitingGif' src='Loading_icon.gif' /></div>'"));
    }, waitingGifTrigger)
}
function removeWaitingGif() {
    clearTimeout(waiting);
    $("#waitingGif").remove();
}

/////////////////////// Posts content manipulation ///////////////////////////////////////////////////////

function linefeeds_to_Html_br(selector) {
    $.each($(selector), function () {
        let postText = $(this);
        var str = postText.html();
        var regex = /[\r\n]/g;
        postText.html(str.replace(regex, "<br>"));
    })
}
function highlight(text, elem) {
    text = text.trim();
    if (text.length >= minKeywordLenth) {
        var innerHTML = elem.innerHTML;
        let startIndex = 0;

        while (startIndex < innerHTML.length) {
            var normalizedHtml = innerHTML.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            var index = normalizedHtml.indexOf(text, startIndex);
            let highLightedText = "";
            if (index >= startIndex) {
                highLightedText = "<span class='highlight'>" + innerHTML.substring(index, index + text.length) + "</span>";
                innerHTML = innerHTML.substring(0, index) + highLightedText + innerHTML.substring(index + text.length);
                startIndex = index + highLightedText.length + 1;
            } else
                startIndex = innerHTML.length + 1;
        }
        elem.innerHTML = innerHTML;
    }
}
function highlightKeywords() {
    if (showKeywords) {
        let keywords = $("#searchKeys").val().split(' ');
        if (keywords.length > 0) {
            keywords.forEach(key => {
                let titles = document.getElementsByClassName('postTitle');
                Array.from(titles).forEach(title => {
                    highlight(key, title);
                })
                let texts = document.getElementsByClassName('postText');
                Array.from(texts).forEach(text => {
                    highlight(key, text);
                })
            })
        }
    }
}

//////////////////////// Forms rendering /////////////////////////////////////////////////////////////////

async function renderEditPostForm(id) {
    $('#commit').show();
    addWaitingGif();
    let response = await Posts_API.Get(id)
    if (!Posts_API.error) {
        let Post = response.data;
        if (Post !== null)
            renderPostForm(Post);
        else
            showError("Post introuvable!");
    } else {
        showError(Posts_API.currentHttpError);
    }
    removeWaitingGif();
}
async function renderDeletePostForm(id) {
    let response = await Posts_API.Get(id)
    if (!Posts_API.error) {
        let post = response.data;
        if (post !== null) {
            let date = convertToFrenchDate(UTC_To_Local(post.Date));
            $("#form").append(`
                <div class="post" id="${post.Id}">
                <div class="postHeader">  ${post.Category} </div>
                <div class="postTitle ellipsis"> ${post.Title} </div>
                <img class="postImage" src='${post.Image}'/>
                <div class="postDate"> ${date} </div>
                <div class="postTextContainer showExtra">
                    <div class="postText">${post.Text}</div>
                </div>
            `);
            linefeeds_to_Html_br(".postText");
            // attach form buttons click event callback
            $('#commit').on("click", async function () {
                await Posts_API.Delete(post.Id);
                if (!Posts_API.error) {
                    await showPosts();
                }
                else {
                    showError("Une erreur est survenue!");
                }
            });
            $('#cancel').on("click", async function () {
                await showPosts();
            });

        } else {
            showError("Post introuvable!");
        }
    } else
        showError(Posts_API.currentHttpError);
}
function newPost() {
    let Post = {};
    Post.Id = 0;
    Post.Title = "";
    Post.Text = "";
    Post.Image = "news-logo-upload.png";
    Post.Category = "";
    Post.Creator = "";
    return Post;
}
function renderPostForm(post = null) {
    let create = post == null;
    if (create) post = newPost();
    $("#form").show();
    $("#form").empty();
    $("#form").append(`
        <form class="form" id="postForm">
            <input type="hidden" name="Id" value="${post.Id}"/>
             <input type="hidden" name="Date" value="${post.Date}"/>
            <label for="Category" class="form-label">Catégorie </label>
            <input 
                class="form-control"
                name="Category"
                id="Category"
                placeholder="Catégorie"
                required
                value="${post.Category}"
            />
            <label for="Title" class="form-label">Titre </label>
            <input 
                class="form-control"
                name="Title" 
                id="Title" 
                placeholder="Titre"
                required
                RequireMessage="Veuillez entrer un titre"
                InvalidMessage="Le titre comporte un caractère illégal"
                value="${post.Title}"
            />
            <label for="Url" class="form-label">Texte</label>
             <textarea class="form-control" 
                          name="Text" 
                          id="Text"
                          placeholder="Texte" 
                          rows="9"
                          required 
                          RequireMessage = 'Veuillez entrer une Description'>${post.Text}</textarea>

            <label class="form-label">Image </label>
            <div class='imageUploaderContainer'>
                <div class='imageUploader' 
                     newImage='${create}' 
                     controlId='Image' 
                     imageSrc='${post.Image}' 
                     waitingImage="Loading_icon.gif">
                </div>
            </div>
            <div id="keepDateControl">
                <input type="checkbox" name="keepDate" id="keepDate" class="checkbox" checked>
                <label for="keepDate"> Conserver la date de création </label>
            </div>
            <input type="submit" value="Enregistrer" id="savePost" class="btn btn-primary displayNone">
        </form>
    `);
    if (create) $("#keepDateControl").hide();

    initImageUploaders();
    initFormValidation(); // important do to after all html injection!

    $("#commit").click(function () {
        $("#commit").off();
        return $('#savePost').trigger("click");
    });
    $('#postForm').on("submit", async function (event) {
        event.preventDefault();
        let post = getFormData($("#postForm"));
        if (post.Category != selectedCategory)
            selectedCategory = "";
        if (create || !('keepDate' in post))
            post.Date = Local_to_UTC(Date.now());
        delete post.keepDate;
        post.Creator = Posts_API.retrieveLoggedUser().Id
        post = await Posts_API.Save(post, create);
        if (!Posts_API.error) {
            await showPosts();
            postsPanel.scrollToElem(post.Id);
        }
        else
            showError("Une erreur est survenue! ", Posts_API.currentHttpError);
    });
    $('#cancel').on("click", async function () {
        await showPosts();
    });
}

function newUser() {
    let User = {};
    User.Id = 0;
    User.Name = "";
    User.Email = "";
    User.Password = "";
    User.Avatar = "news-logo-upload.png";
    return User;
}
function newUserName(userId,name) {
    let User = {};
    User.UserId = userId;
    User.Name = name;
    return User;
}
function renderLogin(message) {
    $('#abort').show();
    $("#viewTitle").text("Connexion");
    hidePosts();
    $("#loginContainer").show();
    $("#loginContainer").empty();
    $("#loginContainer").append(`
        <form class="form" id="loginForm">
            <strong>${message}</strong>
            <input 
                autocomplete="username"
                type="email"
                class="form-control Email"
                name="Email"
                id="Email"
                placeholder="Courriel"
                required
            />
            <br>
            <input 
                type="password"
                class="form-control"
                name="Password"
                id="Password"
                placeholder="Mot de passe"
                autocomplete="current-password"
                required
            />
            <p id="errorFactor" style='color: red;'></p>
            <br>
            <input type="submit" value="Entrer" id="userLogin" class="btn btn-primary">
            <hr>
            <input type="button" value="Nouveau compte" id="newAccount" class="btn btn-info">
        </form>
    `);
    $('#newAccount').on('click', function () {
        renderNewAccount();
    });

    initFormValidation(); 
    $('#loginForm').on('click', '#userLogin', function (event) {
        event.preventDefault();
        (async () => {
            const email = $('#Email').val();

            const password = $('#Password').val();

            const response = await Posts_API.Login(email, password);

            if (response) {
                showPosts();
            } else {
                $('#errorFactor').html(`${Posts_API.currentHttpError}`);
            }
        })();
    });
}
function renderDeleteOwnAccount(){
    let logged = Posts_API.retrieveLoggedUser();
    $('#newAccountContainer').empty();
    $('#newAccountContainer').append(`
        <div class='format-form'>
            <h2>Voulez-vous vraiment effacer votre compte?</h2>
            <input type="buttin" value="Effacer mon compte" id="deleteAccountCheck" class="btn btn-danger">
            <input type="button" value="Annuler" id="cancelUp" class="btn btn-secondary">
        </div>
        `);   
    $('#cancelUp').on('click', function(){
        $('#newAccountContainer').empty();
        renderNewAccount(logged);
    });
    $('#deleteAccountCheck').on('click', async function(event){
        event.preventDefault();
        await Posts_API.DeleteUser(logged.Id); 
        if(!Posts_API.error){
            $('#newAccountContainer').empty();
            noTimeout(logged.Id);
            Posts_API.Logout(logged.Id)
            showPosts();
        }
    });
}
function renderNewAccount(user = null) {
    $('#abort').show();
    $("#viewTitle").text("Inscription");
    let choices;
    let create = user == null;
    if (create) {
        user = newUser();
        user.Avatar = "images/no-avatar.png";
        choices = `
            <input type="submit" value="Enregistrer" id="saveNewAccount" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </form>`;
    }else{
        choices = `
            <input type="submit" value="Enregistrer" id="saveAccount" class="btn btn-primary">
            <input type="button" value="Effacer mon compte" id="deleteMyAccount" class="btn btn-warning">
        </form>`
    }
    hidePosts();
    $("#loginContainer").empty();
    $("#updateProfileCMD").empty();
    
    $("#usersScrollPanel").hide();
    $("#usersPanel").empty();
    $("#newAccountContainer").empty();
    $("#newAccountContainer").show();
    $("#newAccountContainer").append(`
        <form class="form" id="newAccountForm">
            <fieldset>
                <label class="form-label">Adresse ce courriel</label>
                <input 
                    CustomErrorMessage="Ce courriel est déjà utilisé"
                    autocomplete="username"
                    type="email"
                    class="form-control"
                    name="Email"
                    id="Email"
                    placeholder="Courriel"
                    value="${user.Email}"
                    required  
                />
                <input 
                    CustomErrorMessage="Ce courriel est déjà utilisé"
                    autocomplete="username"
                     matchedInputId="Email"
                    type="email"
                    class="form-control MatchedInput"
                    name="EmailVerification"
                    id="EmailVerification"
                    placeholder="Vérification"
                    value="${user.Email}"
                    required
                />
            </fieldset>
            <fieldset>
                <label class="form-label">Mot de passe</label>
                <input
                    type="password"
                    class="form-control"
                    name="Password"
                    id="Password"
                    placeholder="Mot de passe"
                    autocomplete="new-password"
                    defaultInvalidMessage="Pas le même mot de passe"
                    required
                />
                <input 
                    type="password"
                    class="form-control MatchedInput"
                    matchedInputId="Password"
                    name="PasswordVerification"
                    id="PasswordVerification"
                    placeholder="Vérification"
                    autocomplete="new-password"
                    defaultInvalidMessage="Pas le même mot de passe"
                    required
                />
            </fieldset>
            <fieldset>
                <label class="form-label">Nom</label>
                <input 
                    class="form-control"
                    name="Name"
                    id="Name"
                    placeholder="Nom"
                    autocomplete="username"
                    value="${user.Name}"
                    required
                />
            </fieldset>
             <fieldset>
              <label class="form-label">Avatar </label>
                    <div class='imageUploaderContainer'>
                        <div class='imageUploader' 
                            newImage='${create}' 
                            controlId='Avatar' 
                            imageSrc='${user.Avatar}' 
                            waitingImage="Loading_icon.gif">
                    </div>
            </div>
            </fieldset>
            ${choices}
            `);
    initImageUploaders();
    initFormValidation(); // important do to after all html injection!
    addConflictValidation('http://localhost:5000/accounts/conflict','Email','saveNewAccount');
    $('#newAccountForm').on("submit", async function (event) {
        event.preventDefault();
        let user = getFormData($("#newAccountForm"));

        if(create){
        let textToShow = "Votre compte a été créé. Veuillez prendre vos courriels pour réccupérer votre code de vérification qui vous sera demandé lors de votre prochaine connexion.";
        user = await Posts_API.Register(user);
        if (!Posts_API.error) {
            userName = newUserName(user.Id, user.Name);
            newName = await Posts_API.RegisterUserName(userName);
            renderLogin(textToShow);
            $("#newAccountContainer").empty();

                }else {
                    renderLogin(textToShow);
                    showError("Une erreur est survenue! ", Posts_API.currentHttpError);
                    $("#newAccountContainer").empty();
                }
            }else{
                user.Id = Posts_API.retrieveLoggedUser().Id;
                updatedUser = await Posts_API.modifyUserProfil(user);
                if (!Posts_API.error) {
                    await showPosts();
                    $("#newAccountContainer").empty();
                }
            }
        });

        $('#deleteMyAccount').on('click', function(){
            renderDeleteOwnAccount();
        });
        $('#cancel').on("click", async function () {
            $('#newAccountContainer').empty();
            await showPosts();
        });
    }
////////////////////////////////LIKES////////////////////////////////////////////////
function newLike(postId) {
    let Like = {};
    Like.Id = 0;
    Like.PostId = postId;
    Like.Likes = 1;
    Like.UsersLikesList = [];
    Like.UserId =0
    return Like;
}
async function likeClick(postId, event, isAlreadyLikeByLoggedUser = false, loggedUserId = Posts_API.retrieveLoggedUser().Id) {
    event.preventDefault();
    let post = await Posts_API.Get(postId);
    let like = await Likes_API.Get(postId);

    if (post != undefined) {
        post = post.data;
        if (!isAlreadyLikeByLoggedUser && like.data[0]==undefined) {      //si le post n'a jamais été liker 
            let newLikeBtn = newLike(postId);
            if (!Array.isArray(newLikeBtn.UsersLikesList)) {
                newLikeBtn.UsersLikesList = [];
            }

            newLikeBtn.UsersLikesList.push(loggedUserId);
            
            await Likes_API.Register(newLikeBtn);
            if (!Likes_API.error) {
                await showPosts();
                postsPanel.scrollToElem(post.Id);
            }
        } else if (!isAlreadyLikeByLoggedUser && like.data[0] != null && like.data[0]!=undefined) { //si le post n'a jamais été liker par le loggedUser
            
            like = like.data[0];
        
            like.Likes = like.Likes + 1;  //Ajouter Like
            like.UsersLikesList.push(loggedUserId);  //Ajouter le loggedUser dans la liste
            
            await Likes_API.Save(like, false);
            if (!Likes_API.error) {
                await showPosts();
                postsPanel.scrollToElem(post.Id);
            }

        //} else if (!isAlreadyLikeByLoggedUser && like != null && like != undefined){//a déjà été lier

        }else if (isAlreadyLikeByLoggedUser && like.data[0] != null  && like.data[0]!=undefined) {   //si le post a déjà été liker par le loggedUser = décommander le like
            like = like.data[0];
            like.Likes = like.Likes - 1;  //Enlever un like
            like.UsersLikesList = like.UsersLikesList.filter(userId => userId !== loggedUserId);  //Enlever de la liste d'utilisateurs aimant le post le loggedUser

            await Likes_API.Save(like, false);
            if (!Likes_API.error) {
                await showPosts();
                postsPanel.scrollToElem(post.Id);
            }


        }

    }
}
///////////////////////////////render Users////////////////////////////////////////////////
async function renderUsers() {
    $('#abort').show();
    $("#viewTitle").text("Gestion des usagers");
    
    hidePosts();
    $("#loginContainer").empty();
    $("#usersPanel").empty();
   
    $("#usersScrollPanel").show();
    $("#newAccountContainer").empty();
    $("#newAccountContainer").hide();

    let endOfData = false;
    addWaitingGif();
    let response = await Posts_API.GetUser();
    
    if (!Posts_API.error && $("#usersPanel").is(':empty')) {
    
        currentETag = response.ETag;
        let Users = response.data;
        if (Users.length > 0) {
            Users.forEach(User => {
                if(User.Id != Posts_API.retrieveLoggedUser().Id){
                    $("#usersPanel").append(renderUser(User));
                }
            });
        } else
            endOfData = true;
        attach_Posts_UI_Events_Callback();
    } else {
        showError(Posts_API.currentHttpError);
    }
    removeWaitingGif();
    return endOfData;

}
$('#usersPanel').on("click", "#change-permission", async function (event) { //CHANGE-PERMISSION
    event.preventDefault();
    let idUser = $(this).data('info');
    let user = await Posts_API.GetUser(idUser);
    if (user != undefined) {
        user = user.data;
        console.log("Promote before user :" + user.Authorizations.writeAccess);
        await Posts_API.PromoteUser(user);

        if (!Posts_API.error) {
            if ($("#usersPanel").length) {
                $("#usersPanel").empty();
            }
            await renderUsers();
        }
    }
});
$('#usersPanel').on("click", "#block-user", async function (event) {   //BLOCK  ->met des erreurs dans la console mais fait la commande pareil
    event.preventDefault();
    let idUser = $(this).data('info');
    let user = await Posts_API.GetUser(idUser);
    if (user != undefined) {
        user = user.data;
        console.log("Block before user:" + user.isBlocked);
        await Posts_API.BlockUser(user);
    }
    if (!Posts_API.error) {
        console.log("Block after user:" + user.isBlocked);
        if ($("#usersPanel").length) {
            $("#usersPanel").empty();
        }
        await renderUsers();
    }

});
$('#usersPanel').on("click", "#delete-user", async function (event) {  //DELETE
    event.preventDefault();
    let idUser = $(this).data('info');
    let user = await Posts_API.GetUser(idUser);
    if (user != undefined) {
        await Posts_API.DeleteUser(idUser);
        $("#usersPanel").empty();
    }
    if (!Posts_API.error) {
        if ($("#usersPanel").length) {
            $("#usersPanel").empty();
        }
        await renderUsers();
    }

});


////////////////////////////render user//////////////////////////////////////////
function renderUser(user, loggedUser = Posts_API.retrieveLoggedUser()) {
    let icon_permission = ``;
    if (user.isSuper) {
        icon_permission = `<div id="change-permission" data-info="${user.Id}"><i class="change-permission fa fa-user-tie mx-2"></i>Super usager </div>`;
    } else if (user.isAdmin) {
        icon_permission = `<div id="change-permission" data-info="${user.Id}"><i class="change-permission fa fa-user-shield mx-2"></i> Administrateur </div>`;
    } else {
        icon_permission = `<div id="change-permission" data-info="${user.Id}"><i class="change-permission fa fa-user mx-2"></i> Usager de base </div>`;
    }


    let icon_blocker = ``;
    if (user.isBlocked) {
        icon_blocker = `<div id="block-user" data-info="${user.Id}" ><i class="block-user fa fa-user-lock mx-2"></i> Débloquer </div>`;
    } else {
        icon_blocker = `<div id="block-user" data-info="${user.Id}" ><i class="block-user fa fa-user-lock mx-2"></i> Bloquer </div>`;
    }
    return $(`
        <li>
            <img src="${user.Avatar}" class="UserAvatarXSmall"/>
            <p>${user.Name}</p>
            <div class="user-actions">
                ${icon_permission}
                ${icon_blocker}
                <div id="delete-user" data-info="${user.Id}"><i class="delete-user fa fa-user-slash mx-2"></i> Effacer </div>
            </div>
        </li>
    `);


}
function getFormData($form) {
    // prevent html injections
    const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
    var jsonObject = {};
    // grab data from all controls
    $.each($form.serializeArray(), (index, control) => {
        jsonObject[control.name] = control.value.replace(removeTag, "");
    });
    return jsonObject;
}