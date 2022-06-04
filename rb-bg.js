 const APIs = {
    weRead: {
        books: 'get@https://i.weread.qq.com/user/notebooks',
        notes: 'get@https://i.weread.qq.com/book/bookmarklist?bookId={bookId}',
        summarys: 'get@https://weread.qq.com/web/review/list?bookId={bookId}&listType=11&maxIdx=0&count=0&listMode=2&synckey=0&userVid=387886832&mine=1'
    },
    weibo: {
        friends: 'get@https://weibo.com/ajax/friendships/friends?page={pageNo}&uid={uid}',
        fans: 'get@https://weibo.com/ajax/friendships/friends?relate=fans&page={pageNo}&uid={uid}&type=all&newFollowerCount=0'
    },
    douban: {
        books: 'get@https://read.douban.com/j/bookshelf/',
        bookInfo: 'post@https://read.douban.com/j/graphql',
        detail: 'get@https://read.douban.com/ebook/{bookId}',
        notes: 'get@https://read.douban.com/j/article_v2/{bookId}/my_annotations'
    },
    flomo: {
        notes: 'get@https://flomoapp.com/api/memo/?tag=&offset={offset}&tz=8:0'
    },
    dedao: {
        books: 'post@https://www.dedao.cn/api/hades/v1/product/list', //
        notes: 'post@https://www.dedao.cn/api/pc/ledgers/ebook/list' //book_enid: "pqvNQ1KRJa7EmgG8MPKrzykNVbDpBWZXAawQA1xO54nlvZq296YodejLXVJE5eAd"
    }
};


const feynmanRequestServer = function(params, callback) {
    let key = params.api || '';
    if(!key){
        return;
    }

    let keys = key.split('.');
    let url = APIs[keys[0]][keys[1]];
    let urls = url.split('@');
    let method = urls[0].toUpperCase();
    let api = urls[1];
    // console.log(api, urls[1].indexOf('http'));
    
    let data = params.data || {};

    if(data.constructor.name == 'Object'){
        api = subs(api, data);
    };

    let r = new Date().getTime();
    if(method == 'GET'){
        if(api.indexOf('?') == -1){
            api += '?t=' + r;
        }else{
            api += '&t=' + r;
        }
        for(var prop in data){
            api = api + '&' + prop + '=' + data[prop];
        }
    }

    let requestParams = {
        headers: new Headers({
            'Content-Type': 'application/json',
            'token': params.token || ''
        }),
        method: method,
        credentials: 'include'
    };

    if(method != 'GET'){
        data.r = r;
        requestParams.body = JSON.stringify(data);
    }

    console.log(api, requestParams);

    fetch(api, requestParams).then(function(response) {
        //打印返回的json数据
        console.log(api, response);
        response.json().then(function(result) {
            resultCheck(result, callback);
        })
    }).catch(function(e) {
        resultCheck({
            code: 'fail',
            msg: e
        }, callback);
    });

    function resultCheck(result, callback) {
        callback(null, result);
    }

    function subs(temp, data, regexp){
        if(!(Object.prototype.toString.call(data) === "[object Array]")) data = [data];
        var ret = [];
        for (var i = 0, j = data.length; i < j; i++) {
            ret.push(replaceAction(data[i]));
        }
        return ret.join("");
        function replaceAction(object){
            return temp.replace(regexp || (/\\?\{([^}]+)\}/g), function(match, name){
                if (match.charAt(0) == '\\') return match.slice(1);
                return (object[name] != undefined) ? object[name] : '';
            });
        }
    }
}

//接受创建请求
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    if(request.type == 'request'){
        feynmanRequestServer(request, function(err, res){
            res = res || {};
            console.log('back', res, request, sender);
            sendResponse(res);
        });      
    }
}); 