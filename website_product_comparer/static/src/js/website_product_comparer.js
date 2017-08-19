odoo.define('website_product_comparer.compare_widget', function (require) {
  "use strict";

  var core = require('web.core');
  var utils = require('web.utils');
  var ajax = require('web.ajax');
  var _t = core._t;

  var product_to_compare = [];
  var product_categories = {};
  var compare_popup;

  function is_category_same(category_ids) {
    var all_categories = [];
    var status = false;

    $.each(product_categories, function(product_id, cat) {
      all_categories = all_categories.concat(cat)
    });

    category_ids.forEach(function(cat_id) {
      if (all_categories.indexOf(cat_id) > -1) {
        status = true;

        return;
      }
    });

    return status;
  }

  function show_compare_popup() {
    var compared_products_list = $('.compared-products-list');

    if($(compare_popup).data("bs.popover") !== undefined) {
      $(compare_popup).data("bs.popover").options.content =  $(compared_products_list).html();
      $(compare_popup).popover("show");

      setTimeout(function () {
        $(compare_popup).trigger('mouseleave');
      }, 1000);
    }
    
    return;
  }

  function update_product_list_view(value, item_index) {

    var compared_products_list = $('.compared-products-list');

    ajax.jsonRpc("/comparer/get_product_json", 'call', {
      'product_id': value,
      'item_index': item_index
    }, {
      async: false
    }).then(function (data) {
      if (data['item_index'] > 0 && !is_category_same(data['public_categ_ids'])) {
        update_product_list(data['product_id'], data['item_index'], 'REMOVE');
        $("input[type='checkbox'][value='" + data['product_id'] +"']").prop("checked", false);

        alert('Only products of same categories can be compared');

        return;
      }

      product_categories[data['product_id']] = data['public_categ_ids']

      // Fill box with product image
      $(compared_products_list).append(data['website_product_comparer.product_image_view']);
    });

    return;
  }

  function update_product_list(value, item_index, action) {
    if(action === 'REMOVE') {
      var compared_items = $('.compared-item');

      $(compared_items[item_index]).remove();
      delete product_categories[value]

      product_to_compare.splice( $.inArray(value, product_to_compare), 1 );
      utils.set_cookie('product_to_compare', product_to_compare);

      if (product_to_compare.length < 1) {
        $('#prod_count').text(product_to_compare.length);
        $('.product_compare_widget').fadeOut();
        $(compare_popup).popover("hide");

        return;
      }
    }

    if(action === 'ADD') {
      product_to_compare.push(value);
      utils.set_cookie('product_to_compare', product_to_compare);

      if (product_to_compare.length > 0) {
        $('.product_compare_widget').fadeIn();
      }

      update_product_list_view(value, item_index);
    }

    $('#prod_count').text(product_to_compare.length);
    show_compare_popup();

    return;
  }

  function get_product_list(value, action) {
    var products = utils.get_cookie('product_to_compare');
    product_to_compare = (products) ? products.split(',') : [];

    if (product_to_compare.length === 0) {
      $('.product_compare_widget').hide();

      return;    
    } 
    else if (product_to_compare.length > 0) {
      $('.product_compare_widget').show();
    }

    product_to_compare.forEach(function(product_id, index) {
      $("input[type='checkbox'][value='" + product_id +"']").prop("checked", true);

      update_product_list_view(product_id, index);
    });

    $('#prod_count').text(product_to_compare.length);

    return;
  }

  $(document).on('click', 'input.compare_checkbox', function() {
    if ($(this).prop("checked")) {
      if (product_to_compare.length === 4) {
        alert('Cannot compare more then four products');
        $(this).prop("checked", false);

        return;
      }

      update_product_list($(this).val(), product_to_compare.length, 'ADD');

    } else {
      var item_index = product_to_compare.indexOf($(this).val());
      update_product_list($(this).val(), item_index, 'REMOVE');
    }

    return;
  });

  $(document).on('click', '.remove_product', function() {
    var product_id = $(this).data('product-id').toString();
    var item_index = product_to_compare.indexOf(product_id);

    $("input[type='checkbox'][value='" + product_id +"']").prop("checked", false);

    return update_product_list(product_id, item_index, 'REMOVE');
  });

  $(window).on('load', function() {
    var compare_button = $('#fixed_compare_button');
    var compared_products_list = $('.compared-products-list');
    var compare_button_counter;

    compare_popup = compare_button.popover({
      trigger: 'manual',
      animation: true,
      html: true,
      title: function () {
        return _t("Compare list");
      },
      container: 'body',
      placement: 'top',
      template: '<div class="popover comparelist-popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'
    }).on("mouseenter", function () {
      var self = this;

      clearTimeout(compare_button_counter);
      compare_button.not(self).popover('hide');
      compare_button_counter = setTimeout(function() {
        if($(self).is(':hover') && !$(".comparelist-popover:visible").length)
        {
          $(self).data("bs.popover").options.content =  $(compared_products_list).html();
          $(self).popover("show");
          $(".popover").on("mouseleave", function () {
            $(self).trigger('mouseleave');
          });
        }
      }, 100);
    }).on("mouseleave", function () {
      var self = this;
      setTimeout(function () {
        if (!$(".popover:hover").length) {
          if(!$(self).is(':hover')) {
            $(self).popover('hide');
         }
       }
     }, 1000);
    });

    get_product_list();

    return;
  });
});