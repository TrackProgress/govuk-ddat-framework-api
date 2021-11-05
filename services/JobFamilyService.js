import GovukContentApiService from './GovukContentApiService'
import * as cheerio from 'cheerio';

const JobFamilyService = {
  async getJobFamilyList() {
    const contentApiResponse = await GovukContentApiService.getContentApi(
      "/government/collections/digital-data-and-technology-profession-capability-framework"
    )

    const contentHtmlResponse = await GovukContentApiService.getContentHtml(
      "/government/collections/digital-data-and-technology-profession-capability-framework"
    )

    const $ = cheerio.load(contentHtmlResponse)

    let jobFamilyList = []
    $('.group-title').each( (i, jobFamilyElement) => {
      let familyName = $(jobFamilyElement).text()
      let id = familyName.toLowerCase().replace(/\s+/g, '-')
      let roles = this.getRoles($, jobFamilyElement)

      jobFamilyList.push({
        id: id,
        name: familyName,
        roles: roles,
      })
    })

    return jobFamilyList
  },

  getRoles($, jobFamilyElement) {
    let roles = $(jobFamilyElement).next().next().find('.gem-c-document-list .gem-c-document-list__item-title')

    let formattedRoles = []

    $(roles).each( (i, role) => {
      console.log(role)
      formattedRoles.push({
        name: $(role).text(),
      })
    })

    return formattedRoles
  }
}

export default JobFamilyService
