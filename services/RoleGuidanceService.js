import GovukContentApiService from './GovukContentApiService'
import * as cheerio from 'cheerio';

const RoleGuidanceService = {
  async getGuidance(roleId) {
    const content = await GovukContentApiService.getContentApi(`/guidance/${roleId}`)
    const $ = cheerio.load(content.details.body)
    let sections = $('h2')
    let roleLevels = []
    let introduction = this.getIntroSection($, $(sections).first())

    sections.slice(1, -1).each( (i, section) => {
      roleLevels.push( this.getRoleLevelData($, $(section)) )
    })

    let roleData = {
      id: content.content_id,
      title: content.title,
      description: content.description,
      last_updated_at: content.updated_at,
      introduction: introduction,
      role_levels: roleLevels,
    }

    return roleData
  },

  getIntroSection($, section) {
    let roleSummary = []
    
    section.next().next().find('li').each( (i, skill) => {
      roleSummary.push( $(skill).text() )
    })

    return {
      title: section.text(),
      pretext: section.next().text(),
      role_summary: roleSummary,
    }
  },

  getRoleLevelData($, section) {
    let skills = []

    section.next().next().find('li').each( (i, skill) => {
      skills.push( {
        name: $(skill).find('strong').text(),
        description: $(skill).text().split(".").slice(1, -1).join(". ").trim() + ".",
        level: $(skill).text().substring(3).match(/\(Relevant skill level: (.*?)\)/)[1]
      })
    })

    return {
      title: $(section).text(),
      skills: skills,
    }
  },
}

export default RoleGuidanceService
