"""Copy PostNord raw files into carriers/postnord/capture/ and write <file>.boxes.json (hand-measured, source px)."""
import json, os, shutil, subprocess, sys

ROOT = '/Users/basava/Desktop/Marketing /MCSLCarrierVideos'
RAW = os.path.join(ROOT, 'reference', 'PostNord_SetUp_video,s(Raw)')
CAP = os.path.join(ROOT, 'carriers', 'postnord', 'capture')
os.makedirs(CAP, exist_ok=True)

def probe(f):
    out = subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', f]).decode().strip()
    w, h = out.split(',')[:2]
    return int(w), int(h)

# name in capture/ : (raw file, boxes)
T = lambda r, f=None, t=None: r if f is None else {'rect': r, 'from': f, 'to': t}
C = {
  '01_app_installation.mov': ('1_app_installation_MCSL.mov', {
      'qa.sidebar': T([27, 913, 360, 52], 13.5, 99)}),
  '02_address_app_main_menu.png': ('2_address_app_main_menu.png', {
      'qa.title': [368, 16, 470, 52], 'qa.sidebar': [22, 808, 312, 50],
      'menu.address_shop_location': [352, 520, 384, 144],
      'form.person': [1350, 436, 912, 56], 'form.phone': [1350, 570, 912, 56], 'form.street': [1350, 702, 912, 56],
      'form.email_behind': [736, 700, 584, 60],
      'demo.person': [1354, 440, 904, 48], 'demo.phone': [1354, 574, 904, 48], 'demo.email_behind': [740, 705, 574, 48]}),
  '03_address.png': ('3_address.png', {
      'qa.title': [368, 16, 470, 52], 'qa.sidebar': [22, 808, 312, 50],
      'form.person': [1350, 436, 912, 56], 'form.phone': [1350, 570, 912, 56], 'form.street': [1350, 702, 912, 56],
      'form.email': [404, 702, 914, 56],
      'demo.person': [1354, 440, 904, 48], 'demo.phone': [1354, 574, 904, 48], 'demo.email': [408, 706, 906, 48]}),
  '04_add_address_app_main_menu.png': ('4_add_address_app_main_menu.png', {
      'qa.title': [368, 16, 470, 52], 'qa.sidebar': [22, 808, 312, 50],
      'menu.address': [352, 520, 384, 64], 'menu.address_plus': [630, 528, 56, 48],
      'form.person': [1350, 436, 912, 56], 'form.phone': [1350, 570, 912, 56], 'form.street': [1350, 702, 912, 56],
      'form.email_behind': [736, 700, 584, 60],
      'demo.person': [1354, 440, 904, 48], 'demo.phone': [1354, 574, 904, 48], 'demo.email_behind': [740, 705, 574, 48]}),
  '05_carriers_menu.png': ('5.1_add_carrier_main_menu.png', {
      'qa.title': [404, 18, 494, 60], 'qa.sidebar': [10, 988, 350, 54],
      'menu.carriers': [382, 516, 432, 70]}),
  '06_postnord_account.mov': ('6_Carrier_Addition.mov', {
      'qa.title': [346, 26, 434, 42], 'qa.sidebar': [20, 826, 290, 42],
      'carrier.postnord_card': T([2190, 630, 580, 530], 0, 3.6),
      'postnord.account_fields': T([380, 380, 1880, 330], 4, 25)}),
  '07_packaging_app_main_menu.png': ('7_packaging_app_main_menu.png', {
      'qa.title': [368, 16, 470, 52], 'qa.sidebar': [22, 808, 312, 50],
      'menu.shipping_packaging': [352, 586, 384, 106]}),
  '08_weight_based_packaging.png': ('8_weight_based_packaging.png', {
      'qa.title': [368, 16, 470, 52], 'qa.sidebar': [22, 808, 312, 50], 'qa.stepper_carrier': [470, 348, 170, 42],
      'packaging.method_weight': [396, 540, 1340, 300]}),
  '09_box_based_packaging.png': ('9_Box_based_packaging.png', {
      'qa.title': [368, 16, 470, 52], 'qa.sidebar': [22, 808, 312, 50], 'qa.stepper_carrier': [470, 348, 170, 42],
      'packaging.method': [396, 540, 940, 110], 'packaging.boxes': [390, 830, 2396, 350]}),
  '10_other_packing_options.png': ('10_other_packing_options.png', {
      'qa.title': [368, 18, 470, 52], 'qa.sidebar': [22, 810, 312, 50], 'qa.stepper_carrier': [470, 350, 170, 42],
      'packaging.method_with_dropdown': [400, 544, 924, 352]}),
  '11_all_products_app_main_menu.png': ('11_all_products_app_main_menu.png', {
      'qa.title': [368, 18, 470, 52], 'qa.sidebar': [22, 810, 312, 50],
      'menu.all_products': [352, 276, 384, 120], 'menu.products_area': [352, 160, 384, 440]}),
  '12_product_weight_dimensions.png': ('13_product_weight_dimensions(first).png', {
      'qa.title': [368, 16, 470, 52], 'qa.sidebar': [22, 808, 312, 50],
      'product.weight_dimensions': [1052, 316, 1122, 556]}),
  '13_default_weight_dimensions.png': ('12_default_product_weight_dimensions(second).png', {
      'qa.title': [368, 16, 470, 52], 'qa.sidebar': [22, 808, 312, 50],
      'store.default_weight_dimensions': [410, 936, 1870, 108]}),
  '14_postnord_carrier_details.png': ('14_Carrier_other_details.png', {
      'qa.title': [420, 20, 490, 56], 'qa.sidebar': [24, 982, 350, 54],
      'postnord.account_details': [440, 480, 2360, 740], 'postnord.other_details': [450, 1290, 270, 60],
      'postnord.lower_left': [420, 1060, 1560, 330]}),
  '15_postnord_service_point.png': ('15.1_Service_point_carrier_other_detail.png', {
      'qa.title': [420, 22, 490, 56], 'qa.sidebar': [24, 984, 350, 54],
      'postnord.other_details_form': [450, 430, 1830, 970], 'postnord.service_point': [1380, 1036, 240, 84]}),
  '16_postnord_additional_services.mov': ('15.2_insurance_ZFR_Fakru_CN22&CN23_order_action_details.mov', {
      'qa.title': [420, 26, 490, 52], 'qa.sidebar': [24, 984, 350, 54]}),
  '17_single_label.mov': ('16_PostNord_Single_Label_Order_Review.mov', {
      'qa.title': [T([420, 26, 490, 52], 0, 23.9), T([420, 26, 490, 52], 32.9, 99)],
      'qa.sidebar': [T([24, 984, 350, 54], 0, 23.9), T([24, 984, 350, 54], 32.9, 99)],
      'recipient.email': [T([2270, 560, 360, 150], 3.8, 23.9), T([2270, 560, 360, 150], 32.9, 99)],
      'demo.email_a': T([2284, 650, 310, 32], 10.2, 12.2), 'demo.email_a_dim': T([2284, 650, 310, 32], 12.2, 15.2),
      'demo.email_b': [T([2284, 614, 310, 30], 15.2, 23.9), T([2284, 614, 310, 30], 32.9, 99)],
      'print.menu': T([2120, 250, 700, 620], 19, 23.4), 'print.label_option': T([2336, 380, 342, 58], 20.9, 23.4)}),
  '18_add_special_services_menu.png': ('17.1_Add_PostNord_Special_Service_action_menu.png', {
      'qa.title': [420, 22, 490, 56], 'qa.sidebar': [24, 982, 350, 54],
      'grid.special_services_menu': [2220, 840, 556, 220],
      'grid.special_services_search': [2240, 880, 470, 46], 'grid.special_services_option': [2255, 968, 500, 50]}),
  '19_special_services_dialog.png': ('17.2_PostNord_Special_Services_screen.png', {
      'qa.title': [420, 18, 490, 56], 'qa.sidebar': [24, 978, 350, 54],
      'dialog.postnord_additional': [1016, 434, 1240, 766], 'dialog.additional_services': [1056, 610, 1040, 90]}),
  '20_edit_order.mov': ('19_Edit_shipping_address_order_package.mov', {
      'qa.title': [420, 26, 490, 52], 'qa.sidebar': [24, 984, 350, 54],
      'recipient.email': T([2276, 636, 340, 50], 0, 10.6), 'recipient.phone': T([2276, 872, 340, 50], 0, 10.6),
      'popup.phone': [T([1060, 880, 1120, 80], 2.9, 3.4), T([1060, 940, 1120, 80], 3.4, 5.0), T([1060, 670, 1120, 80], 5.0, 5.5), T([1060, 228, 1120, 80], 5.5, 8.2)],
      'popup.email': [T([1060, 1050, 1120, 80], 2.9, 3.4), T([1060, 1110, 1120, 80], 3.4, 5.0), T([1060, 830, 1120, 80], 5.0, 5.5), T([1060, 392, 1120, 80], 5.5, 8.2)],
      'popup.address': T([1020, 120, 1240, 1300], 2.9, 8.2),
      'packages.popup': T([1020, 600, 1200, 470], 13.6, 16.0)}),
  '21_bulk_labels.mov': ('20_Bulk_Shipping_Label_Generation.mov', {
      'qa.title': T([450, 34, 570, 52], 0, 11.8), 'qa.sidebar': T([27, 1095, 386, 56], 0, 11.8)}),
  '22_return_label.mov': ('21_PostNord_Return_Label_Generation.mov', {
      'qa.title': T([450, 34, 570, 52], 0, 33.8), 'qa.sidebar': T([27, 1095, 386, 56], 0, 33.8)}),
  '23_all_products_app_main_menu.png': ('22_all_products_app_main_menu.png', {
      'qa.title': [368, 18, 470, 52], 'qa.sidebar': [22, 810, 312, 50],
      'menu.all_products': [352, 276, 384, 120], 'menu.products_area': [352, 160, 384, 440]}),
  '24_product_customs.png': ('23_product_customs_information.png', {
      'qa.title': [368, 14, 470, 52], 'qa.sidebar': [22, 806, 312, 50],
      'customs.dialog': [982, 306, 1262, 1014], 'customs.hs_code': [1040, 450, 900, 66],
      'customs.country': [1040, 630, 910, 66], 'customs.description': [1040, 896, 900, 64]}),
  '25_products_import_export.png': ('24_all_products_import_export.png', {
      'products.import_export': [1926, 180, 514, 60], 'products.toolbar': [1600, 170, 1200, 80]}),
  '26_cn22_cn23_category.png': ('15.3_CN22_order_action_details.png', {
      'qa.title': [420, 24, 490, 56], 'qa.sidebar': [24, 986, 350, 54],
      'dialog.postnord_additional': [1016, 264, 1240, 1124], 'dialog.cn22_cn23_category': [1056, 610, 1040, 440]}),
  '27_international_label.mov': ('28_PostNord_International_Shipping_Label_Generation.mov', {
      'qa.title': T([450, 34, 570, 52], 0, 7.4), 'qa.sidebar': T([27, 1095, 386, 56], 0, 7.4),
      'recipient.email': T([2280, 650, 400, 100], 0, 7.4),
      'demo.email': [T([2316, 726, 345, 32], 0, 3.3), T([2316, 685, 345, 32], 3.3, 7.15)]}),
  '28_order_fulfillment.mov': ('30_Order_fulfillment.mov', {
      'qa.title': [420, 30, 490, 48], 'qa.sidebar': [24, 986, 350, 54],
      'toast.manifest': T([2440, 120, 440, 420], 0.8, 9.5), 'orders.fulfil_button': T([2436, 776, 224, 64], 0, 1.2),
      'orders.toolbar': T([1700, 700, 1100, 200], 0, 1.2), 'orders.status_column': T([2440, 880, 200, 500], 9.2, 99)}),
  '29_shopify_tracking.mov': ('31.1_Shopify_Shipment_Tracking_and_Emails.mov', {
      'qa.sidebar': [27, 1143, 346, 54],
      'shopify.customer_email': T([2080, 370, 420, 50], 1.0, 99), 'shopify.customer_phone': T([2080, 750, 400, 46], 1.0, 99),
      'shopify.tracking_line': T([660, 400, 620, 60], 1.0, 99),
      'demo.customer_email': T([2090, 377, 330, 33], 1.0, 99), 'demo.customer_phone': T([2090, 753, 230, 29], 1.0, 99)}),
  '30_tracking_email.png': ('31.3_Mail.png', {
      'mail.tracking_number': [410, 548, 575, 40], 'mail.body': [400, 90, 1060, 820],
      'mail.header': [395, 72, 1085, 78], 'mail.shop_button': [938, 322, 488, 114], 'mail.top': [395, 160, 1070, 430]}),
  '31_tracking_dashboard.png': ('31.2_Shopify_Shipment_Tracking_and_Emails.png', {
      'qa.title': [420, 18, 490, 56], 'qa.sidebar': [24, 978, 350, 54],
      'tracking.table': [440, 360, 2400, 1040], 'tracking.expanded_row': [496, 580, 1580, 210]}),
}

for name, (raw, boxes) in C.items():
    src = os.path.join(RAW, raw)
    dst = os.path.join(CAP, name)
    if not os.path.exists(dst) or os.path.getsize(dst) != os.path.getsize(src):
        shutil.copy2(src, dst)
    w, h = probe(dst)
    json.dump({'image': {'w': w, 'h': h}, 'boxes': boxes}, open(dst + '.boxes.json', 'w'), indent=1)
    print(f'{name:40s} {w}x{h}  {len(boxes)} boxes')
