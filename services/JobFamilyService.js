import GovukContentApiService from './GovukContentApiService'
import * as cheerio from 'cheerio';

const JobFamilyService = {
  async getJobFamilyList() {
    let jobFamilyList = []
    const contentHtmlResponse = await GovukContentApiService.getContentHtml(
      "/government/collections/digital-data-and-technology-profession-capability-framework"
    )
    const $ = cheerio.load(contentHtmlResponse)

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
      formattedRoles.push({
        name: $(role).text(),
        apiPath: `/api/role${$(role).attr('href')}`,
      })
    })

    return formattedRoles
  }
}

export default JobFamilyService
