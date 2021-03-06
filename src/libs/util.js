/* eslint-disable no-unused-expressions */
import axios from 'axios';
import env from '../../build/env';
import semver from 'semver';
import packjson from '../../package.json';
import Cookies from 'js-cookie';

let util = {

};
util.title = function (title) {
    title = title || 'Manege My';
    window.document.title = title;
};

const ajaxUrl = env === 'development'
    ? 'http://localhost:8081/api'
    : env === 'production'
        ? 'http://www.nacei.cn/api'
        : 'http://www.nacei.cn/api';

util.ajax = axios.create({
    baseURL: ajaxUrl,
    timeout: 30000
});

util.getWebUrl = function () {
    return ajaxUrl;
};

util.inOf = function (arr, targetArr) {
    let res = true;
    arr.forEach(item => {
        if (targetArr.indexOf(item) < 0) {
            res = false;
        }
    });
    return res;
};

util.oneOf = function (ele, targetArr) {
    if (targetArr.indexOf(ele) >= 0) {
        return true;
    } else {
        return false;
    }
};

util.showThisRoute = function (itAccess, currentAccess) {
    if (typeof itAccess === 'object' && Array.isArray(itAccess)) {
        return util.oneOf(currentAccess, itAccess);
    } else {
        return itAccess === currentAccess;
    }
};

util.getRouterObjByName = function (routers, name) {
    if (!name || !routers || !routers.length) {
        return null;
    }
    // debugger;
    let routerObj = null;
    for (let item of routers) {
        if (item.name === name) {
            return item;
        }
        routerObj = util.getRouterObjByName(item.children, name);
        if (routerObj) {
            return routerObj;
        }
    }
    return null;
};

util.handleTitle = function (vm, item) {
    if (typeof item.title === 'object') {
        return vm.$t(item.title.i18n);
    } else {
        return item.title;
    }
};

util.setCurrentPath = function (vm, name) {
    let title = '';
    let isOtherRouter = false;
    vm.$store.state.app.routers.forEach(item => {
        if (item.children.length === 1) {
            if (item.children[0].name === name) {
                title = util.handleTitle(vm, item);
                if (item.name === 'otherRouter') {
                    isOtherRouter = true;
                }
            }
        } else {
            item.children.forEach(child => {
                if (child.name === name) {
                    title = util.handleTitle(vm, child);
                    if (item.name === 'otherRouter') {
                        isOtherRouter = true;
                    }
                }
            });
        }
    });
    let currentPathArr = [];
    if (name === 'home_index') {
        currentPathArr = [
            {
                title: util.handleTitle(vm, util.getRouterObjByName(vm.$store.state.app.routers, 'home_index')),
                path: '',
                name: 'home_index'
            }
        ];
    } else if ((name.indexOf('_index') >= 0 || isOtherRouter) && name !== 'home_index') {
        currentPathArr = [
            {
                title: util.handleTitle(vm, util.getRouterObjByName(vm.$store.state.app.routers, 'home_index')),
                path: '/home',
                name: 'home_index'
            },
            {
                title: title,
                path: '',
                name: name
            }
        ];
    } else {
        let currentPathObj = vm.$store.state.app.routers.filter(item => {
            if (item.children.length <= 1) {
                return item.children[0].name === name;
            } else {
                let i = 0;
                let childArr = item.children;
                let len = childArr.length;
                while (i < len) {
                    if (childArr[i].name === name) {
                        return true;
                    }
                    i++;
                }
                return false;
            }
        })[0];
        if (currentPathObj.children.length <= 1 && currentPathObj.name === 'home') {
            currentPathArr = [
                {
                    title: '首页',
                    path: '',
                    name: 'home_index'
                }
            ];
        } else if (currentPathObj.children.length <= 1 && currentPathObj.name !== 'home') {
            currentPathArr = [
                {
                    title: '首页',
                    path: '/home',
                    name: 'home_index'
                },
                {
                    title: currentPathObj.title,
                    path: '',
                    name: name
                }
            ];
        } else {
            let childObj = currentPathObj.children.filter((child) => {
                return child.name === name;
            })[0];
            currentPathArr = [
                {
                    title: '首页',
                    path: '/home',
                    name: 'home_index'
                },
                {
                    title: currentPathObj.title,
                    path: '',
                    name: currentPathObj.name
                },
                {
                    title: childObj.title,
                    path: currentPathObj.path + '/' + childObj.path,
                    name: name
                }
            ];
        }
    }
    vm.$store.commit('setCurrentPath', currentPathArr);

    return currentPathArr;
};

util.openNewPage = function (vm, name, argu, query) {
    let pageOpenedList = vm.$store.state.app.pageOpenedList;
    let openedPageLen = pageOpenedList.length;
    let i = 0;
    let tagHasOpened = false;
    while (i < openedPageLen) {
        if (name === pageOpenedList[i].name) { // 页面已经打开
            vm.$store.commit('pageOpenedList', {
                index: i,
                argu: argu,
                query: query
            });
            tagHasOpened = true;
            break;
        }
        i++;
    }
    if (!tagHasOpened) {
        let tag = vm.$store.state.app.tagsList.filter((item) => {
            if (item.children) {
                return name === item.children[0].name;
            } else {
                return name === item.name;
            }
        });
        tag = tag[0];
        if (tag) {
            tag = tag.children ? tag.children[0] : tag;
            if (argu) {
                tag.argu = argu;
            }
            if (query) {
                tag.query = query;
            }
            vm.$store.commit('increateTag', tag);
        }
    }
    vm.$store.commit('setCurrentPageName', name);
};

util.toDefaultPage = function (routers, name, route, next) {
    let len = routers.length;
    let i = 0;
    let notHandle = true;
    while (i < len) {
        if (routers[i].name === name && routers[i].children && routers[i].redirect === undefined) {
            route.replace({
                name: routers[i].children[0].name
            });
            notHandle = false;
            next();
            break;
        }
        i++;
    }
    if (notHandle) {
        next();
    }
};

util.fullscreenEvent = function (vm) {
    vm.$store.commit('initCachepage');
    // 权限菜单过滤相关
    vm.$store.commit('updateMenulist');
    // 全屏相关
};

/**
 * 请求时的拦截
 */
axios.interceptors.request.use(function (config) {
    // 请求之前做一些处理
    return config;
}, function (error) {
    // 当请求异常时做一些处理
    // Promise.reject(error)
    return error;
});

/**
 * 响应时拦截
 */
axios.interceptors.response.use(function (response) {
    //console.info(response)
    return response;
}, function (error) {
    // 当响应异常时做一些处理
    return error.response;
});

//设置默认请求地址前缀
axios.defaults.baseURL = ajaxUrl;

/**
 * get请求
 * @param url
 * @returns {Promise<any>}
 */
util.get = function (url) {
    return new Promise((resolve, reject) => {
        axios.get(url)
        .then(res => { resolve(res); })
        .catch(err => { reject(err); });
    });
};

/**
 * post请求
 * @param url
 * @param data
 * @returns {Promise<any>}
 */
util.post = function (url, data) {
    return new Promise((resolve, reject) => {
        axios.post(url,data)
            .then(res => { resolve(res); })
            .catch(err => { reject(err); });
    });
};

/**
 * post带配置请求
 * @param url
 * @param data
 * @param config
 * @returns {Promise<any>}
 */
util.post = function (url, data,config) {
    return new Promise((resolve, reject) => {
        axios.post(url,data,config)
            .then(res => { resolve(res); })
            .catch(err => { reject(err); });
    });
};

/**
 * 处理业务返回状态
 * @param vm
 * @param status
 */
util.responseMsg = function(vm,status){
    try {
        if(status == null || status == ""){
            vm.$Message.error({
                duration: 2,
                content: '系统繁忙,请稍后再试！'
            });
            return;
        }else if(status.statusCode == '40001'){
            Cookies.remove('user');
            Cookies.remove('access');
            Cookies.remove('locking');
            vm.$router.push({
                name: 'login',
            });
            return;
        }else if(status.statusCode == '10002'){
            Cookies.set('locking', "1");
            vm.$router.push({
                name: 'locking'
            });
        }else{
            vm.$Message.error({
                duration: 2,
                content: status.msg
            })
        }
    }catch (e) {
        vm.$Message.error({
            duration: 2,
            content: '系统繁忙,请稍后再试！'
        })
    }
};

/**
 * 处理网络返回状态
 * @param vm
 * @param status
 */
util.httpErrorMsg = function(vm,status){
    try {
        if(status.status == '403'){
            vm.$router.push({
                name: 'error-403',
            });
            return;
        }else if(status.status == '404'){
            vm.$router.push({
                name: 'error-404',
            });
            return;
        }else if(status.status == '500'){
            vm.$router.push({
                name: 'error-500',
            });
            return;
        }
        vm.$Message.error({
            duration: 2,
            content: '系统繁忙,请稍后再试！'
        })
    }catch (e) {
        vm.$Message.error({
            duration: 2,
            content: '系统繁忙,请稍后再试！'
        })
    }
};
/**
 * 自定义正确消息
 * @param vm
 * @param time
 * @param content
 */
util.frontSuccMsg = function(vm,time,content){
    vm.$Message.success({
        duration: time,
        content: content
    });
};

/**
 * 自定义错误消息
 * @param vm
 * @param time
 * @param content
 */
util.frontErrMsg = function(vm,time,content){
    vm.$Message.error({
        duration: time,
        content: content
    });
};

/**
 * base64转图片文件
 * @param base64Data
 * @param fileName
 */
util.base64toFile = function(base64Data,fileName){
    var arr = base64Data.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    let suffix = mime.split("/");
    var file = new File([u8arr], fileName+"."+suffix[1],{ type: mime });
    return file;
};

util.formatDateToString = function (date){
    var date = new Date(date);
    var month = date.getMonth() + 1;
    var day = date.getDate();
    return date.getFullYear() + '-' + this.getFormatDate(month) + '-' + this.getFormatDate(day);
};

util.getFormatDate = function (arg){
    if (arg == undefined || arg == '') {
        return '';
    }
    var re = arg + '';
    if (re.length < 2) {
        re = '0' + re;
    }
    return re;
};

util.checkUpdate = function (vm) {
    // axios.get('https://api.github.com/repos/iview/iview-admin/releases/latest').then(res => {
    //     let version = res.data.tag_name;
    //     vm.$Notice.config({
    //         duration: 0
    //     });
    //     if (!semver.lt(packjson.version, version)) {
    //         vm.$Notice.info({
    //             title: 'iview-admin更新啦',
    //             desc: '<p>iView-admin更新到了' + version + '了，去看看有哪些变化吧</p><a style="font-size:13px;" href="https://github.com/iview/iview-admin/releases" target="_blank">前往github查看</a>'
    //         });
    //     }
    // });
};

export default util;
