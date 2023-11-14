import api from '@/api'

const request = {
    loginOut: () => {
        return api.get(
            `/user/loginOut`,
        )
    },
    subscribeUser: (data) => {
        return api.post(
            `/user/subscribeUser`,
            data,
        )
    }
}

export default request