// "R": required field
let example_exhibit_item_objects = [
    // heading
    {
        "uuid": "{heading uuid}",
        "type": "heading", // (R)
        "is_member_of_exhibit": "{parent exhibit uuid}", 
        "text": "Heading Text", // {string | html} heading text (default: "")
        "is_visible": 1, // {0,1} If 0, the heading is not displayed, but its link appears in the page navigation (default: 1, heading text is shown in the exhibit)
        "is_anchor": 1, // {0,1} If 0, the heading link is not included in the page navigation (default: 1, heading link appears in navigation menu)

        "styles": {
            "backgroundColor": "", // hex or rgb value from color picker
            "color": "", // hex or rgb value from color picker
            "fontFamily": "", // list of font-family options
            "fontSize": ""
        },

        "order": 1
    },
    
    // item
    {
        "uuid": "{item uuid}",
        "is_member_of_exhibit": "{parent exhibit uuid}",
        "thumbnail": "{filename.ext}", // path to user uploaded thumbnail image, or url to external thumbnail image
        "title": "Item Title", // {string} (default: null, item displays no title) *** The title field will appear in the navigation as a sublink under the previous page heading ***
        "caption": "Item caption text", // {string} (default: null, item displays no caption under media content)
        "item_type": "image", // {'image', 'audio', 'video', 'pdf', 'external'} (R)
        "media": "{filename or ddu pid}", // { {filename}.{extension} OR {digitaldu item uuid} (IF 'is_repo_item' == 1) OR {kaltura entry_id} (IF 'is_kaltura_item' == 1)} (R if no "text" value)
        "text": "", // {string | html} 
        "wrap_text": 1, // bool {0,1} If 1, text will wrap around the media element (default: 1)
        "type": "item", // {'row' | 'grid' | 'vertical_timeline' | 'heading'} (R)
        "layout": "media_left", // {'media_right' | 'media_left' | 'media_top' | 'media_bottom' | "media_only" | "text_only"} (R)
        "media_width": "50", // {25|33|50|66|75} width of the media element in the item as percent (default: '50') * use only on side-by-side layouts 'media_right' and 'media_left' 
        "media_padding": 1, // bool {0,1} If 1, margins will be added to the item display. If 0, there will be no margins (default: 1)

        /* user style settings (default: {}) */
        "styles": { 
            "backgroundColor": "", // hex or rgb value from color picker
            "color": "", // hex or rgb value from color picker
            "fontFamily": "", // list of font-family options
            "fontSize": ""
        },
        
        "is_kaltura_item": 0, // bool {0,1} If 1, will render in Kaltura embedded viewer (requires a valid kaltura entry_id in the 'media' field) (default: 0) 
        "is_repo_item": 0, // bool {0,1} If 1, will use the digitaldu object uuid in the "media" field above to stream the item from the repository (default: 0)
        "pdf_open_to_page": 1, // {integer} For 'item_type': 'pdf', will open the pdf file to this page (default: 1)  
        "is_published": 1, // (default: 0)
        "is_embedded": 0,  // (default: 0) If 1, media is embedded in the item on the template, and is not opened in the popup viewer when clicked. Media is viewed/played from the template
        "order": 1
    },
    
    // standard item grid (columns)
    {
        "uuid": "{item uuid}",
        "is_member_of_exhibit": "{parent exhibit uuid}",
        "type": "grid", // (R)
        "columns": "4", // int {1,2,3,4}
        "title": "Item Grid Title", // *** The title field will appear in the navigation as a sublink under the previous page heading ***
        "order": 3,
        "styles": {
            "color": "#303030",
            "backgroundColor": "#706560",
            "fontFamily": "arial"
        },
        "items": [
            // grid item fields (contains all item fields. grid specific fields are shown below) :
            {
                "description": "", // {string | html} description text displayed on the grid item. *IF there is no description, but there is text, the text will be displayed on the grid item and ALSO in the modal viewer.
                "uuid": "{item uuid}",
                "is_member_of_exhibit": "{parent exhibit uuid}",
                "thumbnail": "{filename.ext}", // path to user uploaded thumbnail image, or url to external thumbnail image
                "title": "Item Title", // {string} (default: null, item displays no title) *** The title field will appear in the navigation as a sublink under the previous page heading ***
                "caption": "Item caption text", // {string} (default: null, item displays no caption under media content)
                "item_type": "image", // {'image', 'audio', 'video', 'pdf', 'external'} (R)
                "media": "{filename or ddu pid}", // { {filename}.{extension} OR {digitaldu item uuid} (IF 'is_repo_item' == 1) OR {kaltura entry_id} (IF 'is_kaltura_item' == 1)} (R if no "text" value)
                "text": "", // {string | html} 
                "type": "item", // {'row' | 'grid' | 'vertical_timeline' | 'heading'} (R)
                "layout": "media_left", // {'media_right' | 'media_left' | 'media_top' | 'media_bottom' | "media_only" | "text_only"} (R)
                "media_width": "50", // {25|33|50|66|75|100} width of the media element in the item as percent (default: '50') * use only on side-by-side layouts 'media_right' and 'media_left' 
                "media_padding": 1, // bool {0,1} If 1, margins will be added to the item display. If 0, there will be no margins (default: 1)

                /* user style settings (default: {}) */
                "styles": { 
                    "backgroundColor": "", // hex or rgb value from color picker
                    "color": "", // hex or rgb value from color picker
                    "fontFamily": "", // list of font-family options
                    "fontSize": ""
                },
            
                "is_kaltura_item": 0, // bool {0,1} If 1, will render in Kaltura embedded viewer (requires a valid kaltura entry_id in the 'media' field) (default: 0)  
                "is_repo_item": 0, // bool {0,1} If 1, will use the digitaldu object uuid in the "media" field above to stream the item from the repository (default: 0)
                "pdf_open_to_page": 1, // {integer} For 'item_type': 'pdf', will open the pdf file to this page (default: 1)  
                "is_published": 1, // (default: 0)
                "order": 1
            }
        ],
        "is_published": 1
    },

    // VTL grid (columns)
    {
        "uuid": "{item uuid}",
        "is_member_of_exhibit": "{parent exhibit uuid}",
        "type": "vertical_timeline", // (R)
        "columns": "4", // int {1,2,3,4}
        "title": "Item Grid Title", // *** The title field will appear in the navigation as a sublink under the previous page heading ***
        "order": 3,
        "styles": {
            "color": "#303030",
            "backgroundColor": "#706560",
            "fontFamily": "arial"
        },
        "items": [
            // grid item fields (contains all item fields. grid specific fields are shown below) :
            {
                "date": "", // {string} date string e.g. '2022-10-13T20:24:20.000Z'
                "description": "", // {string | html} description text displayed on the grid item. *IF there is no description, but there is text, the text will be displayed on the grid item and ALSO in the modal viewer.
                "uuid": "{item uuid}",
                "is_member_of_exhibit": "{parent exhibit uuid}",
                "thumbnail": "{filename.ext}", // path to user uploaded thumbnail image, or url to external thumbnail image
                "title": "Item Title", // {string} (default: null, item displays no title) *** The title field will appear in the navigation as a sublink under the previous page heading ***
                "caption": "Item caption text", // {string} (default: null, item displays no caption under media content)
                "item_type": "image", // {'image', 'audio', 'video', 'pdf', 'external'} (R)
                "media": "{filename or ddu pid}", // { {filename}.{extension} OR {digitaldu item uuid} (IF 'is_repo_item' == 1) OR {kaltura entry_id} (IF 'is_kaltura_item' == 1)} (R if no "text" value)
                "text": "", // {string | html} 
                "type": "item", // {'row' | 'grid' | 'vertical_timeline' | 'heading'} (R)

                /* user style settings (default: {}) */
                "styles": { 
                    "backgroundColor": "", // hex or rgb value from color picker
                    "color": "", // hex or rgb value from color picker
                    "fontFamily": "", // list of font-family options
                    "fontSize": ""
                },
            
                "is_kaltura_item": 0, // bool {0,1} If 1, will render in Kaltura embedded viewer (requires a valid kaltura entry_id in the 'media' field) (default: 0)  
                "is_repo_item": 0, // bool {0,1} If 1, will use the digitaldu object uuid in the "media" field above to stream the item from the repository (default: 0)
                "pdf_open_to_page": 1, // {integer} For 'item_type': 'pdf', will open the pdf file to this page (default: 1)  
                "is_published": 1, // (default: 0)
                "order": 1
            }
        ],
        "is_published": 1
    }
]