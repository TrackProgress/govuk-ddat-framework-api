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
      levels: roleLevels,
    }

    return roleData
  },

  getIntroSection($, section) {
    let summary = []
    let skills = []

    section.next().next().find('li').each( (i, skill) => {
      summary.push( $(skill).text() )
    })

    section.next().next().next().next().next().find('li').each( (i, skill) => {
      skills.push( {
        name: $(skill).find('strong').text(),
        description: $(skill).text().split(".").slice(1).join(". ").trim(),
      } )
    })

    return {
      title: section.text(),
      summary_pretext: section.next().text(),
      summary: summary,
      skills_subheading: section.next().next().next().text(),
      skills: skills,
    }
  },

  getRoleLevelData($, section) {
    let data = {
      title: $(section).text(),
      skills: [],
      subroles: [],
    }

    if (section.next().first().get(0).tagName === "p") {
      data.summary_pretext = section.next().text()
      data.summary = []

      section.next().next().find('li').each( (i, skill) => {
        data.summary.push( $(skill).text() )
      })

      if (section.next().next().next().get(0).tagName === "p") {
        data.summary_posttext = section.next().next().next().text()
        data.subroles.push({
          heading: section.next().next().next().next().text(),
          skills: section.next().next().next().next().next().find('li')
        })
        data.subroles.push({
          heading: section.next().next().next().next().next().next().text(),
          skills: section.next().next().next().next().next().next().next().find('li')
        })
      } else {
        data.subroles.push({
          heading: section.next().next().next().text(),
          skills: section.next().next().next().next().find('li')
        })
      }
    } else {
      data.subroles.push({
        heading: section.next().text(),
        skills: section.next().next().find('li')
      })
    }

    data.subroles.forEach( (subrole, i) => {
      let _skills = []
      subrole.skills.each( (i, skill) => {
        let skillsArray = $(skill).text().split(".").filter(n => n)
        let description = skillsArray.slice(1, -1).join(". ").trim() + "."
        let skillLevel = skillsArray[skillsArray.length - 1].match(/\(Relevant skill(s?) level: (.*?)\)/)
        skillLevel = skillLevel[skillLevel.length - 1]

        _skills.push( {
          name: $(skill).find('strong').text(),
          description: description,
          level: skillLevel
        })
      })
      data.subroles[i].skills = _skills
    })

    return {
      title: data.title,
      summary_pretext: data.summary_pretext,
      summary: data.summary,
      summary_posttext: data.summary_posttext,
      subroles: data.subroles,
    }
  },
}

export default RoleGuidanceService
