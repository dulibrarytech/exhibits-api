/**

 Copyright 2019 University of Denver

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.

 */

 'use strict';

 const LOG4JS = require('log4js');
 
 LOG4JS.configure({
     appenders: {
         out: { type: 'stdout' },
         exhibits_api: {
             type: 'dateFile',
             filename: './logs/exhibits_api.log',
             compress: true
         }
     },
     categories: {
         default: {
             appenders: ['out', 'exhibits_api'],
             level: 'debug'
         }
     }
 });
 
 exports.module = function () {
     return LOG4JS.getLogger();
 };