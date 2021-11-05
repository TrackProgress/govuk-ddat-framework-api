import axios from "axios"

const baseURL = "https://www.gov.uk"
const apiBaseURL = "https://www.gov.uk/api/content"

const GovukContentApiService = {
  async getContentApi( path ) {
    return (await axios.get(`${apiBaseURL}${path}`)).data
  },

  async getContentHtml( path ) {
    return (await axios.get(`${baseURL}${path}`)).data
  }
}

export default GovukContentApiService