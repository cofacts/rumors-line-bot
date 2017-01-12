# app.rb
require 'sinatra'
require 'line/bot'
require './query.rb'
require 'sinatra/reloader' if development?

require 'active_support/all' # For airtable
require 'airtable'
require 'newrelic_rpm'

@airtable_client = Airtable::Client.new ENV["AIRTABLE_API_KEY"]
airtable = @airtable_client.table "apphrXta7kRli978O", "Rumors"
postback_airtable = @airtable_client.table "appJuvjYqXT3HnQzD", "Responses"

def client
  @client ||= Line::Bot::Client.new { |config|
    config.channel_secret = ENV["LINE_CHANNEL_SECRET"]
    config.channel_token = ENV["LINE_CHANNEL_TOKEN"]
  }
end

post '/callback' do
  body = request.body.read

  signature = request.env['HTTP_X_LINE_SIGNATURE']
  unless client.validate_signature(body, signature)
    error 400 do 'Bad Request' end
  end

  events = client.parse_events_from(body)
  events.each { |event|
    case event
    when Line::Bot::Event::Message
      case event.type
      when Line::Bot::Event::MessageType::Text

        if event['source']['type'] == 'user' # Don't log group messages
          p event
        end

        search_result = query event.message['text']

        if search_result.length > 0
          # Data length limit = 300 characters
          query_payload = event.message['text'][0..50]
          result_payload = search_result.join('|')[0..170]
          feedback  = {
            type: 'template',
            altText: "謝謝您的使用。", # For PC version
            template: {
              type: 'confirm',
              text: '請問這份資訊對您有用嗎？',
              actions: [{
                type: 'postback',
                label: "是",
                data: {id: event['message']['id'], ok: true, answer: result_payload, rumor: query_payload}.to_json
              }, {
                type: 'postback',
                label: "否",
                data: {id: event['message']['id'], ok: false, answer: result_payload, rumor: query_payload}.to_json
              }]
            }
          }

          client.reply_message(event['replyToken'], search_result[0..3].map{|t| textmsg(t)}.push(feedback))

        elsif event['source']['type'] == 'user' # Don't reply empty prompt when in group
          client.reply_message(event['replyToken'], textmsg("找不太到與這則訊息相關的澄清文章唷！"))

          # Only record to airtable if can't find anything
          airtable.create Airtable::Record.new(:"Message ID" => event['message']['id'], :"Rumor Text" => event['message']['text'], :"Received Date" => event['timestamp'])
        end

      when Line::Bot::Event::MessageType::Image, Line::Bot::Event::MessageType::Video
        client.reply_message(event['replyToken'], textmsg("謝謝分享，但我現在還看不懂圖片與影片呢。"))
        # response = client.get_message_content(event.message['id'])
        # p event
        # p response
        #tf = Tempfile.open("content")
        #tf.write(response.body)



      end

    when Line::Bot::Event::Postback
      p event

      client.reply_message(event['replyToken'], textmsg("謝謝您的回應！ :D"))
      payload = JSON.parse(event['postback']['data'])
      postback_airtable.create Airtable::Record.new(
        messageId: payload['id'],
        ok: payload['ok'],
        rumor: payload['rumor'],
        answer: payload['answer'],
        timestamp: event['timestamp']
      )
    end
  }

  "OK"
end

def textmsg text
  if text.is_a? String
    return {
      type: 'text',
      text: text
    }
  end

  # it is probably already wrapped. Skip wrapping with type.
  return text
end
