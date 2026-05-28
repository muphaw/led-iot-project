const getDynamicUrl = ()=>{
    const params = new URLSearchParams(window.location.search)
    const paraUrl = params.get('baseUrl')

    return(
    paraUrl ||
    import.meta.env.BASE_URL ||
    '' //api link
)
}

const AppConfig = {
    APP_NAME : import.meta.env.BASE_URL,
    BASE_URL :  getDynamicUrl()
}

export default AppConfig

