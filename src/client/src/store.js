import Vue from "vue";
import Vuex from "vuex";
import axios from "axios";
Vue.use(Vuex);

export default new Vuex.Store({
    state: {
        loggedin : false,
        user : undefined,
        user_img : null,
    },
    mutations: {
        updateUser(state){
            axios.get('/auth/user')
                .then((res) => {
                    if (res.data.user !== undefined) {
                        state.loggedin = true;
                        state.user = res.data.user;
                        state.user_img = res.data.user.image_path;
                        console.log(state.user_img);
                    }else{
                        state.loggedin = false;
                        state.user = undefined;
                    }
                }).catch((err) => {
                console.log(err);

            });

            //
            // axios.get('/auth/user/image')
            //     .then((res)=>{
            //         state.user_img = "data:image/png;base64,"+res.data
            //     }).catch((err)=>{
            //     console.log("err!!",err);
            // });
        },
        // updateUserImg(state){
            // axios.get('/auth/user/image')
            //     .then((res)=>{
            //         state.user_img = "data:image/png;base64,"+res.data
            //     }).catch((err)=>{
            //     console.log("err!!",err);
            // });
        // }
    },
    getters: {
        getUser: state => () => state.user.id,
        getUserInfo: state => () => state.user,
        getUserImg: state => () => state.user_img
    }

})