# flask application
import os
import json
from datetime import datetime
import pandas as pd
from flask import Flask, render_template, request, jsonify

from sqlalchemy import create_engine, Column, Integer, String, Boolean, ForeignKey, Float, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.orm.exc import NoResultFound

# Define the SQLAlchemy Base
Base = declarative_base()

# Define the table class with the name "items"
class Items(Base):
    __tablename__ = 'items'

    id = Column(Integer, primary_key=True, autoincrement=True)
    bidAmountType = Column(String)
    bidType = Column(String)
    biddingNotice = Column(String)
    currencyAbbreviation = Column(String)
    eventAddress = Column(String)
    eventCity = Column(String)
    eventDateBegin = Column(DateTime) 
    eventDateEnd = Column(DateTime) 
    eventName = Column(String)
    eventState = Column(String)
    eventZip = Column(String)
    holdAmount = Column(Float)
    auctionId = Column(Integer)
    lotCount = Column(Integer) 
    mastercardAccepted = Column(Boolean)
    paymentInfo = Column(String)
    previewDateInfo = Column(String)
    regType = Column(String)
    shippingAndPickupInfo = Column(String)
    termsAndConditions = Column(String)
    visaAccepted = Column(Boolean)
    auctionOptions__shippingType = Column(String)
    auctioneer__address = Column(String)
    auctioneer__city = Column(String)
    auctioneer__country = Column(String)
    auctioneer__countryId = Column(Integer)
    auctioneer__email = Column(String)
    auctioneer__fax = Column(String)
    auctioneer__id = Column(Integer)
    auctioneer__internetAddress = Column(String)
    auctioneer__name = Column(String)
    auctioneer__phone = Column(String)
    auctioneer__postalCode = Column(String)
    auctioneer__state = Column(String)
    # second df
    bidAmount = Column(Float)
    bidQuantity = Column(Integer)
    category = Column(String)
    description = Column(String)
    estimate = Column(String)
    lotId = Column(Integer)
    itemId = Column(Integer)
    lead = Column(String)
    lotNumber = Column(Integer)
    pictureCount = Column(Integer)
    quantity = Column(Integer)
    rv = Column(String)
    saleOrder = Column(Integer)
    shippingOffered = Column(Boolean)
    featuredPicture__fullSizeLocation = Column(String)
    featuredPicture__thumbnailLocation = Column(String)
    lotState__bidCount = Column(Integer)
    lotState__bidMax = Column(Float)
    lotState__bidMaxTotal = Column(Float)
    lotState__buyNow = Column(Boolean)
    lotState__choiceType = Column(String)
    lotState__highBid = Column(Float)
    lotState__highBuyerId = Column(String)
    lotState__minBid = Column(Float)
    lotState__productStatus = Column(String)
    lotState__productUrl = Column(String)
    lotState__quantitySold = Column(Integer)

# Create an SQLite database
engine = create_engine('sqlite:///data.sqlite')

# Create the table in the database
Base.metadata.create_all(engine)

def unique_categories(categories):
    unique_parts = {part for category in categories for part in category['fullCategory'].split(" - ")}
    unique_category = " - ".join(sorted(unique_parts))
    return unique_category

# Create a list of unique categories
def create_category_tree(unique_cats, categories):
    cat_tree = categories.copy()

    def insert_into_tree(path, tree):
        if not path:
            return
        if path[0] not in tree:
            tree[path[0]] = {}
        insert_into_tree(path[1:], tree[path[0]])

    for cat in unique_cats:
        insert_into_tree(cat, cat_tree)

    return cat_tree


# function to convert data from databse to json
def map_lot_attributes(results):
    results = [{'auctioneer_name':item.auctioneer__name,
            'highBid':item.lotState__highBid,
            'thumbnailLocation':item.featuredPicture__thumbnailLocation,
            'lead':item.lead,
            'lotId':item.lotId,
            'auctionId':item.auctionId,
            'category':item.category,
            'description':item.description,
            'eventDateEnd':item.eventDateEnd.strftime('%Y-%m-%d'),
            } for item in results]
    
    return results


# convert from json to database
def convert_core():
    # Create a SQLAlchemy session
    Session = sessionmaker(bind=engine)
    session = Session()

    # Check which files have been processed already
    with open('file_status.json', 'r') as f:
        file_status = json.load(f)
    
    processed_files = set(file_status["files_converted_to_database"])
    files_to_process = [file for file in os.listdir('auctions') if file not in processed_files]

    # Fetch existing items from the database and store in a set for faster lookups
    existing_items = {(item.lotId, item.auctionId) for item in session.query(Items.lotId, Items.auctionId).all()}
    
    items_data_list = []

    for file in files_to_process:
        with open(os.path.join('auctions', file), 'r') as json_file:
            data = json.load(json_file)

        auction = data['auction']
            
        for item_dict in data['lots'].values():
            item_lotId = item_dict['id']
            item_auctionId = auction['id']

            if (item_lotId, item_auctionId) not in existing_items:
                categories = unique_categories(item_dict['category'])
                item_data = Items(
                    bidAmountType = auction['bidAmountType'],
                    bidType = auction['bidType'],
                    biddingNotice = auction['biddingNotice'],
                    currencyAbbreviation = auction['currencyAbbreviation'],
                    eventAddress = auction['eventAddress'],
                    eventCity = auction['eventCity'],
                    eventDateBegin = datetime.strptime(auction['eventDateBegin'], '%Y-%m-%dT%H:%M:%S'),
                    eventDateEnd = datetime.strptime(auction['eventDateEnd'], '%Y-%m-%dT%H:%M:%S'),
                    eventName = auction['eventName'],
                    eventState = auction['eventState'],
                    eventZip = auction['eventZip'],
                    holdAmount = auction['holdAmount'],
                    auctionId = auction['id'],
                    lotCount = auction['lotCount'],
                    mastercardAccepted = auction['mastercardAccepted'],
                    paymentInfo = auction['paymentInfo'],
                    previewDateInfo = auction['previewDateInfo'],
                    regType = auction['regType'],
                    shippingAndPickupInfo = auction['shippingAndPickupInfo'],
                    termsAndConditions = auction['termsAndConditions'],
                    visaAccepted = auction['visaAccepted'],
                    auctionOptions__shippingType = auction['auctionOptions']['shippingType'],
                    auctioneer__address = auction['auctioneer']['address'],
                    auctioneer__city = auction['auctioneer']['city'],
                    auctioneer__country = auction['auctioneer']['country'],
                    auctioneer__countryId = auction['auctioneer']['countryId'],
                    auctioneer__email = auction['auctioneer']['email'],
                    auctioneer__fax = auction['auctioneer']['fax'],
                    auctioneer__id = auction['auctioneer']['id'],
                    auctioneer__internetAddress = auction['auctioneer']['internetAddress'],
                    auctioneer__name = auction['auctioneer']['name'],
                    auctioneer__phone = auction['auctioneer']['phone'],
                    auctioneer__postalCode = auction['auctioneer']['postalCode'],
                    auctioneer__state = auction['auctioneer']['state'],
                    # second df
                    bidAmount = item_dict['bidAmount'],
                    bidQuantity = item_dict['bidQuantity'],
                    category = categories,
                    description = item_dict['description'],
                    estimate = item_dict['estimate'],
                    lotId = item_dict['id'],
                    itemId = item_dict['itemId'],
                    lead = item_dict['lead'],
                    lotNumber = item_dict['lotNumber'],
                    pictureCount = item_dict['pictureCount'],
                    quantity = item_dict['quantity'],
                    rv = item_dict['rv'],
                    saleOrder = item_dict['saleOrder'],
                    shippingOffered = item_dict['shippingOffered'],
                    featuredPicture__fullSizeLocation = item_dict['featuredPicture']['fullSizeLocation'],
                    featuredPicture__thumbnailLocation = item_dict['featuredPicture']['thumbnailLocation'],
                    lotState__bidCount = item_dict['lotState']['bidCount'],
                    lotState__bidMax = item_dict['lotState']['bidMax'],
                    lotState__bidMaxTotal = item_dict['lotState']['bidMaxTotal'],
                    lotState__buyNow = item_dict['lotState']['buyNow'],
                    lotState__choiceType = item_dict['lotState']['choiceType'],
                    lotState__highBid = item_dict['lotState']['highBid'],
                    lotState__highBuyerId = item_dict['lotState']['highBuyerId'],
                    lotState__minBid = item_dict['lotState']['minBid'],
                    lotState__productStatus = item_dict['lotState']['productStatus'],
                    lotState__productUrl = 'https://www.highbid.com/lot/' + str(item_dict['id']) + '/',
                    lotState__quantitySold = item_dict['lotState']['quantitySold']
                )
                items_data_list.append(item_data)
        
        file_status["files_converted_to_database"].append(file)
        print(f'Processed {file}')
        
    # perform a bulk insert
    if items_data_list:
        session.bulk_save_objects(items_data_list)
        session.commit()

    with open('file_status.json', 'w') as f:
        json.dump(file_status, f, indent=4)

    # close session
    session.close()
    return 'Converted to database'

# process json file to categories.json
def process_core():
    # read categories.json
    with open('categories.json', 'r') as f:
        categories = json.load(f)

    with open('file_status.json', 'r') as f:
        file_status = json.load(f)

    files = os.listdir('auctions')

    for file in files:
        if file not in file_status["files_processed_for_categories"]:
            with open(os.path.join('auctions', file), 'r') as json_file:
                data = json.load(json_file)
                print(f'Processing {file} for categories')

            cats = []
            # iterate over each row in the dataframe
            for item in data['lots'].values():
                category_list = item['category']
                cats.extend([i["fullCategory"].split(" - ") for i in category_list if "fullCategory" in i])

            unique_cats = [list(t) for t in set(tuple(element) for element in cats)]

            cat_tree = create_category_tree(unique_cats, categories)

            # Write the updated categories.json
            with open('categories.json', 'w') as f:
                json.dump(cat_tree, f, indent=4)

            # Add the file to the list of files that have been processed
            file_status["files_processed_for_categories"].append(file)

            # Write the updated file_status.json
            with open('file_status.json', 'w') as f:
                json.dump(file_status, f, indent=4)

    return jsonify({'status': 'success'})

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/config')
def config():
    return render_template('config.html')


@app.route('/convert')
def convert():
    return convert_core()

@app.route('/convertAll')
def convertAll():
    # read file_status.json and remove all files from files_converted_to_database
    with open('file_status.json', 'r') as f:
        file_status = json.load(f)
        file_status["files_converted_to_database"] = []
        with open('file_status.json', 'w') as f:
            json.dump(file_status, f, indent=4)
    return convert_core()

@app.route('/process')
def process():
    return process_core()

@app.route('/processAll')
def processAll():
    # read file_status.json and remove all files from files_processed_for_categories
    with open('file_status.json', 'r') as f:
        file_status = json.load(f)
        file_status["files_processed_for_categories"] = []
        with open('file_status.json', 'w') as f:
            json.dump(file_status, f, indent=4)
    return process_core()



# read json file from auctions folder to analyze to front end
@app.route('/data')
def data():
    # read from database
    Session = sessionmaker(bind=engine)
    session = Session()

    # query database for 100 items
    results = session.query(Items).limit(100).all()

    results = map_lot_attributes(results)

    # close session
    session.close()

    return jsonify({'res':results})


@app.route('/getCategories')
def getCategories():
    with open('categories.json', 'r') as f:
        categories = json.load(f)
    return jsonify(categories)


@app.route('/filterCategories', methods=['POST'])
def filterCategories():
    if request.method == 'POST':
        data = request.get_json()
        l = list(data)
        # query database for 100 items with keywords from list l
        Session = sessionmaker(bind=engine)
        session = Session()
        results = session.query(Items)
        for i in range(len(l)):
            results = results.filter(Items.category.like('%' + l[i] + '%'))
        results = results.limit(100).all()
        results = map_lot_attributes(results)
        # close session
        session.close()
    return jsonify({'res':results})


@app.route('/search', methods=['POST'])
def search():
    if request.method == 'POST':
        data = request.get_json()
        # query database for 100 items with keywords from list l
        Session = sessionmaker(bind=engine)
        session = Session()
        results = session.query(Items)
        results = results.filter(Items.lead.like('%' + data + '%'))
        total_results = results.count()
        results = results.limit(100).all()
        results = map_lot_attributes(results)
        # close session
        session.close()
    return jsonify({'res':results, 'total_results':total_results})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5015, threaded=True, debug=True)