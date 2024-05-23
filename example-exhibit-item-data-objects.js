// heading
let example_exhibit_item_objects = [

    {
        "type": "heading", // (R)
        "is_member_of_exhibit": "1", 
        "text": "Example Items", // {string | html} heading text (default: "")
        "order": 1, 
        "is_visible": 1, // {0,1} If 0, the heading is not displayed, but its link appears in the page navigation (default: 1, heading text is shown in the exhibit)
        "is_anchor": 1, // {0,1} If 0, the heading link is not included in the page navigation (default: 1, heading link appears in navigation menu)

        "styles": {
            "backgroundColor": "", // hex or rgb value from color picker
            "color": "", // hex or rgb value from color picker
            "fontFamily": "", // list of font-family options
            "fontSize": ""
        },
    },
    
    // full-row item
    {
        "uuid": "f14d40a9ba5f040c5868c36b473ad7f5",
        "is_member_of_exhibit": "1",
        "thumbnail": "",
        "title": "item", // {string} (default: null, item displays no title) *** The title field will appear in the navigation as a sublink under the previous page heading ***
        "caption": "Image from Kynewisbok, vol36, academic year 1933-1934", // {string} (default: null, item displays no caption under media content)
        "item_type": "image", // {'image', 'large_image', 'audio', 'video', 'pdf', 'external'} (R)
        "media": "f14d40a9ba5f040c5868c36b473ad7f5.jpg", // { {filename}.{extension} | {digitaldu item uuid} } (R if no "text" value)
        "text": "<div style='font-size: 1.3em; font-weight: bold'>Fullwidth item</div><hr>Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of \"de Finibus Bonorum et Malorum\" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, \"Lorem ipsum dolor sit amet..\", comes from a line in section 1.10.32. Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of \"de Finibus Bonorum et Malorum\" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, \"Lorem ipsum dolor sit amet..\", comes from a line in section 1.10.32. Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of \"de Finibus Bonorum et Malorum\" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, \"Lorem ipsum dolor sit amet..\", comes from a line in section 1.10.32.", // {string | html} (R if no "url" value)
        "wrap_text": 1, // bool {0,1} If 1, text will wrap around the media element (default: 1)
        "description": "", // {string | html} This is the text displayed on a grid item (preview only, the item text is not displayed on preview items) (default: null, not displayed)
        "type": "item", // {'row' | 'grid' | 'vertical_timeline' | 'heading'} (R)
        "layout": "media_left", // {'media_right' | 'media_left' | 'media_top' | 'media_bottom' | "media_only" | "text_only"} (R)
        "media_width": "65", // {int from x to y TBD} width of the media element in the item as percent (default: '50') * use only on side-by-side layouts 'media_right' and 'media_left' 
        "media_padding": 1,// bool {0,1} If 1, side padding will be applied to the media item (default: 1)

        /* user style settings (default: {}) */
        "styles": { 
    
            /* 
             * user styles for exhibit item 
             */
            "item": {
                "backgroundColor": "", // hex or rgb value from color picker
                "color": "", // hex or rgb value from color picker
                "fontFamily": "", // list of font-family options
                "fontSize": ""
            }
        },
    
        "is_published": 1, // (default: 0)
        "is_embedded": 0,  // (default: 0) If 1, media is embedded in the item on the template, and is not opened in the popup viewer when clicked. Media is viewed/played from the template
        "order": 2,
        "created": "2022-10-13T20:24:20.000Z"
    },
    
    // item grid
    {
        "uuid": "7358d544fab45abb782ab2bf39d3ff50a",
        "is_member_of_exhibit": "1",
        "type": "grid", // (R)
        "columns": "4", // (1-4)
        "title": "item grid", // *** The title field will appear in the navigation as a sublink under the previous page heading ***
        "order": 3,
        "styles": {
            "item_grid": { // styles for grid section
                "color": "#303030",
                "backgroundColor": "#706560",
                "fontFamily": "arial"
            }
        },
        "items": [
            {
                "uuid": "27e8d544f03300b782ab2bf39d3cbb8a",
                "is_member_of_exhibit": "1",
                "date": "March 5, 1864",
                "title": "John Evans",
                //"description": "University of Denver (DU) founder John Evans poses for a portrait. Evans was also one of the founders of Northwestern University, as well as the second governor of the Colorado Territory.",
                "description": "description",
                "caption": "University of Denver founded by John Evans, also Colorado's Second Territorial Governor.",
                "item_type": "image",
                "media": "27e8d544f03300b782ab2bf39d3cbb8a.jpeg",
                "text": "text",
                "thumbnail": "27e8d544f03300b782ab2bf39d3cbb8a.jpeg",
                "type": "item",
                "styles": {
                    "item": { // styles this item in grid
                        "backgroundColor": "#849B78",
                        "fontFamily": "Verdana"
                    }
                },
                "is_published": 1, // this should be ok here, not in the parent grid object
                "order": 1, // this should be ok here, not in the parent grid object
                "created": "2022-10-13T20:24:20.000Z"
            },
            {
                "uuid": "6cf1a7cf3bd10f588bd0122d05346877",
                "is_member_of_exhibit": "1",
                "date": "November 29, 1864",
                "title": "One November Morning",
                "description": "Sand Creek Massacre. More than 160 Cheyenne and Arapaho people - primarily women, children, and elders - are massacred by the Colorado Third Cavalry, led by DU trustee Colonel John Chivington.",
                "caption": "Sand Creek Massacre",
                "item_type": "image",
                "media": "6cf1a7cf3bd10f588bd0122d05346877.jpeg",
                "text": "test text",
                "type": "item",
                "styles": {
                    "item": {
                        "backgroundColor": "#F09169",
                        "fontFamily": "Verdana"
                    }
                },
                "is_published": 1,
                "order": 2,
                "created": "2022-10-13T20:24:20.000Z"
            },
            {
                "uuid": "69cc54aa37cc876deb529821667e2f89",
                "is_member_of_exhibit": "1",
                "date": "1919",
                "title": "\"Ministers Snapped in Action\" article in the DU Clarion vol. 27.",
                "description": "The \"Fighting Parsons\" is first mentioned as a nickname for the football team in the Clarion. No likeness or cartoon associated with the nickname; the team is also called \“Fighting Ministers.\"",
                "caption": "Clipping of \"Ministers Snapped in Action\" article in the DU Clarion vol. 27.",
                "item_type": "image",
                "media": "69cc54aa37cc876deb529821667e2f89.jpeg",
                "text": "test text",
                "type": "item",
                "styles": {
                    "item": { // styles this item in grid
                        "backgroundColor": "#849B78",
                        "fontFamily": "Times New Roman"
                    }
                },
                "is_published": 1,
                "order": 3,
                "created": "2022-10-13T20:24:20.000Z"
            },
            {
                "uuid": "e5dda358941b0bd63e474a5a27a723c0",
                "is_member_of_exhibit": "1",
                "date": "October 1924",
                "title": "\"Denver 'Battling Ministers' Seek Fitting Name\" Clarion Article.",
                "description": "Clarion article “Denver ‘Battling Ministers’ Seek Fitting Name: War Cry to Replace Outworn Slogans is Big Contest Aim” highlights student desire to change nickname to something that better reflects the school mission and spirit.",
                "caption": "Clarion article “Denver ‘Battling Ministers’",
                "item_type": "image",
                "media": "e5dda358941b0bd63e474a5a27a723c0.jpeg",
                "text": "test text",
                "type": "item",
                "styles": {
                    "item": {
                        "backgroundColor": "#F09169"
                    }
                },
                "is_published": 1,
                "order": 4,
                "created": "2022-10-13T20:24:20.000Z"
            },
            {
                "uuid": "a72e0377e0dce115e5bc71fac040dbdb",
                "is_member_of_exhibit": "1",
                "date": "1925",
                "title": "\"Ministers Snapped in Action\" article in the DU Clarion vol. 27.",
                "description": "Pioneers first mentioned in 1924-25 (vol 27) Kynewisbok, the student yearbook; in subsequent years (such as this image from the 1925-26 yearbook), the University added a “Pioneer Day” to their Homecoming celebrations, where faculty, students, and staff would dress in 1890s costume, often with white students in costume as Native Americans.",
                "caption": "caption text",
                "item_type": "image",
                "media": "a72e0377e0dce115e5bc71fac040dbdb.png",
                "text": "test text",
                "type": "item",
                "styles": {
                    "item": { // styles this item in grid
                        "backgroundColor": "#849B78",
                        "fontFamily": "arial"
                    }
                },
                "is_published": 1,
                "order": 5,
                "created": "2022-10-13T20:24:20.000Z"
            },
            {
                "uuid": "b2d4e85c511220df168e4240583de4e5",
                "is_member_of_exhibit": "1",
                "date": "1940s to 1950s",
                "title": "\"Pioneer Pete\" Image from Kynewisbok",
                "description": "\"Pioneer Pete\" character appears first as illustrations and then as a mascot-type in the 1950s. “Pioneer Pete” was a person in costume who appeared at football games",
                "caption": "caption text",
                "item_type": "image",
                "media": "b2d4e85c511220df168e4240583de4e5.png",
                "text": "test text",
                "type": "item",
                "layout": "media_bottom",
                "media_width": "100",
                "styles": {
                    "item": {
                        "backgroundColor": "#F09169"
                    }
                },
                "is_published": 1,
                "order": 6,
                "created": "2022-10-13T20:24:20.000Z"
            }
        ]
    },
    
    // vertical timeline item grid
    {
        "uuid": "7358d544fab45abb782ab2bf39d3ff50a",
        "is_member_of_exhibit": "1",
        "type": "vertical_timeline", // (R)
        "title": "vertical timeline item grid", // *** The title field will appear in the navigation as a sublink under the previous page heading ***
        "order": 4,
        "styles": {
            "item_grid": { // styles for grid section
                "color": "#303030",
                "backgroundColor": "gray",
                "fontFamily": "Cursive"
            }
        },
        "items": [
            {
                "uuid": "27e8d544f03300b782ab2bf39d3cbb8a",
                "is_member_of_exhibit": "1",
                "date": "March 5, 1864",
                "title": "University of Denver Founder and Trustee John Evans",
                "description": "University of Denver (DU) founder John Evans poses for a portrait. Evans was also one of the founders of Northwestern University, as well as the second governor of the Colorado Territory.",
                "caption": "University of Denver founded by John Evans, also Colorado's Second Territorial Governor.",
                "item_type": "image",
                "media": "27e8d544f03300b782ab2bf39d3cbb8a.jpeg",
                "text": "test text",
                "thumbnail": "27e8d544f03300b782ab2bf39d3cbb8a.jpeg",
                "type": "item",
                "year_label": "1850", // insert a year label to the timeline before this item
                "styles": {
                    "item": { // styles for this item in grid
                        "color": "green",
                        "backgroundColor": "black",
                        "fontFamily": "arial"
                    }
                },
                "is_published": 1, // this should be ok here, not in the parent grid object
                "order": 1, // this should be ok here, not in the parent grid object
                "created": "2022-10-13T20:24:20.000Z"
            },
            {
                "uuid": "6cf1a7cf3bd10f588bd0122d05346877",
                "is_member_of_exhibit": "1",
                "date": "November 29, 1864",
                "title": "One November Morning",
                "description": "Sand Creek Massacre. More than 160 Cheyenne and Arapaho people - primarily women, children, and elders - are massacred by the Colorado Third Cavalry, led by DU trustee Colonel John Chivington.",
                "caption": "Sand Creek Massacre",
                "item_type": "image",
                "media": "6cf1a7cf3bd10f588bd0122d05346877.jpeg",
                "text": "test text",
                "type": "item",
                "styles": {
                    "item": {
                        
                    }
                },
                "is_published": 1,
                "order": 2,
                "created": "2022-10-13T20:24:20.000Z"
            },
            {
                "uuid": "69cc54aa37cc876deb529821667e2f89",
                "is_member_of_exhibit": "1",
                "date": "1919",
                "title": "\"Ministers Snapped in Action\" article in the DU Clarion vol. 27.",
                "description": "The \"Fighting Parsons\" is first mentioned as a nickname for the football team in the Clarion. No likeness or cartoon associated with the nickname; the team is also called \“Fighting Ministers.\"",
                "caption": "Clipping of \"Ministers Snapped in Action\" article in the DU Clarion vol. 27.",
                "item_type": "image",
                "media": "69cc54aa37cc876deb529821667e2f89.jpeg",
                "text": "test text",
                "type": "item",
                "styles": {},
                "year_label": "1900",
                "is_published": 1,
                "order": 3,
                "created": "2022-10-13T20:24:20.000Z"
            },
            {
                "uuid": "e5dda358941b0bd63e474a5a27a723c0",
                "is_member_of_exhibit": "1",
                "date": "October 1924",
                "title": "\"Denver 'Battling Ministers' Seek Fitting Name\" Clarion Article.",
                "description": "Clarion article “Denver ‘Battling Ministers’ Seek Fitting Name: War Cry to Replace Outworn Slogans is Big Contest Aim” highlights student desire to change nickname to something that better reflects the school mission and spirit.",
                "caption": "Clarion article “Denver ‘Battling Ministers’",
                "item_type": "image",
                "media": "e5dda358941b0bd63e474a5a27a723c0.jpeg",
                "text": "test text",
                "type": "item",
                "styles": {},
                "is_published": 1,
                "order": 4,
                "created": "2022-10-13T20:24:20.000Z"
            },
            {
                "uuid": "a72e0377e0dce115e5bc71fac040dbdb",
                "is_member_of_exhibit": "1",
                "date": "1925",
                "title": "\"Ministers Snapped in Action\" article in the DU Clarion vol. 27.",
                "description": "Pioneers first mentioned in 1924-25 (vol 27) Kynewisbok, the student yearbook; in subsequent years (such as this image from the 1925-26 yearbook), the University added a “Pioneer Day” to their Homecoming celebrations, where faculty, students, and staff would dress in 1890s costume, often with white students in costume as Native Americans.",
                "caption": "caption text",
                "item_type": "image",
                "media": "a72e0377e0dce115e5bc71fac040dbdb.png",
                "text": "test text",
                "type": "item",
                "styles": {},
                "is_published": 1,
                "order": 5,
                "created": "2022-10-13T20:24:20.000Z"
            },
            {
                "uuid": "b2d4e85c511220df168e4240583de4e5",
                "is_member_of_exhibit": "1",
                "date": "1955",
                "title": "\"Pioneer Pete\" Image from Kynewisbok",
                "description": "\"Pioneer Pete\" character appears first as illustrations and then as a mascot-type in the 1950s. “Pioneer Pete” was a person in costume who appeared at football games",
                "caption": "caption text",
                "item_type": "image",
                "media": "b2d4e85c511220df168e4240583de4e5.png",
                "text": "test text",
                "type": "item",
                "year_label": "1950",
                "styles": {},
                "is_published": 1,
                "order": 6,
                "created": "2022-10-13T20:24:20.000Z"
            }
        ]
    }]