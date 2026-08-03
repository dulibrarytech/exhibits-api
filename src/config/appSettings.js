// appSettings.js

'use strict'

module.exports = {
    app: {
      appTitle: "Exhibits App",
      appDescription: "A digital exhibit builder for libraries and museums.",
      appKeywords: "digital exhibits, library exhibits, museum exhibits, exhibit builder",
      appAuthor: "University of Denver Libraries",
    },

    repository: {
      enableIIIFThumbnail: true,
      enableIIIFItem: true,
      fetchResourceFile: false,
    },

    search: {
      objectTypes: ["exhibit", "item", "grid", "vertical_timeline", "vertical_timeline_2"],
      itemTypes: ["image", "large_image", "audio", "video", "pdf"],
      searchFields: ["title", "description", "text", "caption", "media_subjects.topics", "media_subjects.genre_form", "media_subjects.places"],
      aggregationFields: [
        {
            "field": "item_type",
            "path": "item_type.keyword"
        },
        {
            "field": "type",
            "path": "type.keyword"        
        },
        {
            "field": "subjects",
            "path": "subjects.keyword"
        },
        {
            "field": "media_subjects.topics",
            "path": "media_subjects.topics.keyword"
        },
        {
            "field": "media_subjects.genre_form",
            "path": "media_subjects.genre_form.keyword"
        },
        {
            "field": "media_subjects.places",
            "path": "media_subjects.places.keyword"
        },
      ],
      maxAggregationCount: null,
    },
  }