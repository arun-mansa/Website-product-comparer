# -*- coding: utf-8 -*-
{
    'name': "Website product comparer",

    'summary': """
        Allow users to compare between selected products of same category""",

    'description': """
        Allow users to compare between selected products of same category
    """,

    'author': "Arun Kumar",
    'website': "https://www.upwork.com/o/profiles/users/_~019ad950647691afeb/",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/master/odoo/addons/base/module/module_data.xml
    # for the full list
    'category': 'Website',
    'version': '0.1',

    # any module necessary for this one to work correctly
    'depends': ['base', 'website_sale'],
    'data': [
        'views/templates.xml',
    ],
    'installable': True,
}