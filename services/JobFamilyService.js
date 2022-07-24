import GovukContentApiService from './GovukContentApiService'
import * as cheerio from 'cheerio';
import { kebabCase } from 'lodash';

const JobFamilyService = {
  async getJobFamilyList(url = '') {
    let jobFamilyList = []
    const contentHtmlResponse = await GovukContentApiService.getContentHtml(
      "/government/collections/digital-data-and-technology-profession-capability-framework"
    )
    const $ = cheerio.load(contentHtmlResponse)

    $('.group-title').each( (i, jobFamilyElement) => {
      let familyName = $(jobFamilyElement).text()
      let category = familyName.replace('job family', '').replace('(QAT)', '').trim()
      let id =  kebabCase(category)
      let roles = this.getRoles($, jobFamilyElement, url)

      jobFamilyList.push({
        id: id,
        category: category,
        name: familyName,
        roles: roles,
      })
    })

    return jobFamilyList
  },

  getRoles($, jobFamilyElement, url) {
    let roles = $(jobFamilyElement).next().next().find('.gem-c-document-list .gem-c-document-list__item-title')
    let formattedRoles = []

    $(roles).each( (i, role) => {
      formattedRoles.push({
        name: $(role).text(),
        api_path: `${url}/api${$(role).attr('href')}`,
        skills_api_path: `${url}/api${$(role).attr('href')}/skills`,
      })
    })

    return formattedRoles
  }
}

export default JobFamilyService
