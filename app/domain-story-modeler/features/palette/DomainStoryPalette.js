'use strict';

import { assign } from 'min-dash';
import { getNameFromType } from '../../language/naming';
import { getIconForType } from '../../language/iconDictionary';
import { initWorkObjectIconDictionary, getWorkObjectIconDictionary } from '../../language/workObjectIconDictionary';
import { initActorIconDictionary, getActorIconDictionary } from '../../language/actorIconDictionary';
import { getIconset } from '../../language/iconConfig';
import { GROUP } from '../../language/elementTypes';
import { appendedIconsTag } from '../iconSetCustomization/persitence';
import { overrideAppendedIcons } from '../../language/all_Icons';

/**
 * A palette that allows you to create BPMN _and_ custom elements.
 */

export default function PaletteProvider(palette, create, elementFactory, spaceTool, lassoTool) {

  this._create = create;
  this._elementFactory = elementFactory;
  this._spaceTool = spaceTool;
  this._lassoTool = lassoTool;

  palette.registerProvider(this);
}

PaletteProvider.$inject = [
  'palette',
  'create',
  'elementFactory',
  'spaceTool',
  'lassoTool',
  'modeling'
];

PaletteProvider.prototype.getPaletteEntries = function() {

  var actions = {},
      create = this._create,
      elementFactory = this._elementFactory,
      spaceTool = this._spaceTool,
      lassoTool = this._lassoTool;

  function createAction(type, group, className, title, options) {

    function createListener(event) {
      var shape = elementFactory.createShape(assign({ type: type }, options));

      assign(shape.businessObject, {
        id: shape.id
      });

      if (options) {
        shape.businessObject.di.isExpanded = options.isExpanded;
      }

      create.start(event, shape);
    }

    var shortType = type.replace(/^domainStory:/, '');

    return {
      group: group,
      className: className,
      title: 'Create ' + title || 'Create ' + shortType,
      action: {
        dragstart: createListener,
        click: createListener
      }
    };
  }

  return initPalette(actions, spaceTool, lassoTool, createAction);
};

function appendCSSStyleCheat(customIcons) {
  var sheet = document.getElementById('iconsCss').sheet;
  var dictionary = require('collections/dict');
  var customIconDict = new dictionary();

  customIconDict.addEach(customIcons);
  var customIconDictKeys = customIconDict.keysArray();

  var css_rules_num = sheet.cssRules.length;

  customIconDictKeys.forEach(name => {
    var src = customIconDict.get(name);
    var iconStyle = ('.icon-domain-story-' + name + '::before {'+
        'content: url(\'' + src + '\');'+
        ' background-repeat: no-repeat;'+
        ' width: 25px; height: 25px;}');
    sheet.insertRule(iconStyle, css_rules_num);
    css_rules_num++;
  });
}

function initPalette(actions, spaceTool, lassoTool, createAction) {
  var config = getIconset();


  var customIcons = localStorage.getItem(appendedIconsTag);
  if (customIcons) {
    overrideAppendedIcons(JSON.parse(customIcons));
    appendCSSStyleCheat(JSON.parse(customIcons));
  }

  initActorIconDictionary(config.actors);
  initWorkObjectIconDictionary(config.workObjects);

  var actorTypes = getActorIconDictionary();

  actorTypes.keysArray().forEach(actorType => {
    var name = getNameFromType(actorType);
    var icon = getIconForType(actorType);

    var action = [];
    action['domainStory-actor'+name] = createAction(actorType, 'actor', icon, name);
    assign(actions, action);
  });

  assign(actions, {
    'actor-separator': {
      group: 'actor',
      separator: true
    }
  });

  var workObjectTypes = getWorkObjectIconDictionary();

  workObjectTypes.keysArray().forEach(workObjectType => {

    var name = getNameFromType(workObjectType);
    var icon = getIconForType(workObjectType);

    var action = [];
    action['domainStory-actor'+name] = createAction(workObjectType, 'actor', icon, name);
    assign(actions, action);
  });

  assign(actions, {
    'workObject-separator': {
      group: 'workObject',
      separator: true
    },
    'domainStory-group': createAction(
      GROUP, 'group', 'icon-domain-story-tool-group', 'group'
    ),
    'group-separator': {
      group: 'group',
      separator: true
    },
    'lasso-tool': {
      group: 'tools',
      className: 'bpmn-icon-lasso-tool',
      title: 'Activate the lasso tool',
      action: {
        click: function(event) {
          lassoTool.activateSelection(event);
        }
      }
    },
    'space-tool': {
      group: 'tools',
      className: 'bpmn-icon-space-tool',
      title: 'Activate the create/remove space tool',
      action: {
        click: function(event) {
          spaceTool.activateSelection(event);
        }
      }
    }
  });

  return actions;
}