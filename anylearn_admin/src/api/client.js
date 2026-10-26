import axios from 'axios'

const client = axios.create({
  baseURL: '/v2',
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (res) => {
    // The server hands out a new token while the old one is past half of its life, so a busy admin is never signed out.
    const refreshed = res.headers?.['x-refreshed-token']
    if (refreshed) localStorage.setItem('admin_token', refreshed)
    return res
  },
  (err) => {
    // 401 = signed out or token expired. (403 is a permission answer: staying signed in is right.)
    if (err.response?.status === 401 && window.location.pathname !== '/admin/login') {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      window.location.href = '/admin/login'
    }
    return Promise.reject(err)
  }
)

export default client
