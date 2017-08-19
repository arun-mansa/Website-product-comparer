import json
import logging
from werkzeug.exceptions import Forbidden

from odoo import http, tools, _
from odoo.http import request
from odoo.addons.website.models.website import slug

class ProductComparer(http.Controller):

  def _get_value(self, product_id, attr_id, data):
    try:
      value = data[product_id, attr_id]
    except:
      value = ""

    return value

  @http.route(['/comparer/compare_product'], type='http', auth="public", website=True)
  def compare_product_view(self, **kw):
    return request.render("website_product_comparer.product_comparison_view_holder")

  @http.route(['/comparer/get_product_json'],type='json', auth="public", methods=['POST'], website=True, csrf=False)
  def get_product_json(self, product_id, item_index=0, **kw):
    value = {}
    Product = request.env['product.template']

    product = Product.search([('id', '=', product_id)])

    value['item_index'] = item_index
    value['product_id'] = product.id
    value['public_categ_ids'] = map(lambda x: x.id, product.public_categ_ids)
    value['website_product_comparer.product_image_view'] = request.env['ir.ui.view'].render_template("website_product_comparer.product_image_view", {
      'product': product
    })
    
    return value

  @http.route(['/comparer/get_product_comparison'],type='json', auth="public", methods=['POST'], website=True, csrf=False)
  def get_product_comparison(self, product_ids, **kw):
    value = {}

    pricelist_context = dict(request.env.context)
    if not pricelist_context.get('pricelist'):
      pricelist = request.website.get_current_pricelist()
      pricelist_context['pricelist'] = pricelist.id
    else:
      pricelist = request.env['product.pricelist'].browse(pricelist_context['pricelist'])
      request.context = dict(request.context, pricelist=pricelist.id, partner=request.env.user.partner_id)


    Product = request.env['product.template']
    products = Product.search([('id', 'in', product_ids)])

    nbr_prod=0
    list_attr={}
    prod_list_attr={}

    for product_p in products:
      for product in product_p.product_variant_ids:
        nbr_prod=nbr_prod+1
        for y in range(0,len(product.attribute_value_ids)):
          list_attr[product.attribute_value_ids[y].attribute_id.id]=product.attribute_value_ids[y].attribute_id.name
          prod_list_attr[product.id, product.attribute_value_ids[y].attribute_id.id]=product.attribute_value_ids[y].name

    from_currency = request.env.user.company_id.currency_id
    to_currency = pricelist.currency_id
    compute_currency = lambda price: from_currency.compute(price, to_currency)
    get_value = lambda product_id, attrib_id, data: self._get_value(product_id, attrib_id, data)

    value['website_product_comparer.product_comparison_view'] = request.env['ir.ui.view'].render_template("website_product_comparer.product_comparison_view", {
      'nbr_prod':nbr_prod,
      'products':products,
      'attr':list_attr,
      'value':prod_list_attr,
      'get_value': get_value,
      'compute_currency': compute_currency,
      'slug': slug
    })

    return value
