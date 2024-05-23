example_exhibit_data_object = [
    {
      "uuid": "1",
      "type": "exhibit",
      "title": "Title: Test Exhibit", // {string | html} title for exhibit banner (R) 
      "subtitle": "Subtitle: The Legacy of Settler Colonialism and the University of Denver", // {string | html} (default: null, no subtitle displayed)
      "banner_template": "banner_1", // {'banner_1' | 'banner_2'} (default: banner_1) 
      "about_the_curators": "About the curators content", // tbd
      "alert_text": "this is an <strong>Alert</strong>", // {string | html} alert banner displayed below hero section (default: null, alert banner not displayed)
      "hero_image": "brent-learned_one-november-morning.jpeg", // {filename.extension} filename or path to file (default: null, hero image not displayed. image section will be displayed with a gray background if the banner template has a hero image section)
      "thumbnail_image": "example-exhibit_tn.jpg", // {filename.extension} filename. exhibit thumbnail image. (default: null, thumbnail image will be derived from the 'hero_image' if present.)
      "description": "<strong>Description text:</strong> At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat.", // {string | html} the exhibit banner text
      "page_layout": "top_nav", // {'top_nav', 'side_nav} (default: top_nav)
      "template": "vertical_scroll",  // {'vertical_scroll' | 'item_centered'} (R)
  
      /* user style settings (value is a JSON string, default: "{}") */
      "styles": {
      
        "exhibit": {
      
          /* applied to navigation menu bar or menu sidebar section */
          "navigation": {
              "backgroundColor": "", // hex or rgb value from color picker
              "color": "", // hex or rgb value from color picker
              "fontFamily": "", // list of font-family options
              "fontSize": ""
          },
      
          /* applied to entire exhibit, below hero section */
          "template": {
              "backgroundColor": "", // hex or rgb value from color picker
              "color": "", // hex or rgb value from color picker
              "fontFamily": "", // list of font-family options
              "fontSize": ""
          }
      
        }
      
    },
      
      "is_published": 1, // {0,1} (default: 0)
      "is_featured": 1 // {0,1) if 1, will appear in featured exhibits display (default: 0)
      
    }]