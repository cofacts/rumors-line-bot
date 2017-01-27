require 'net/http'
require 'google/apis/customsearch_v1'
require 'json'
require 'nokogiri'

CX = ENV['GSE_ID']
KEY = ENV['GSE_KEY']

RUMOR_KEYWORDS = %w{網路謠言 闢謠 謠言 流言 傳言 假的}

# Given a message to search,
# Returns an array of search results.
#
# Currently the search is equivalent to:
# https://cse.google.com/cse/publicurl?cx=006504535273787703401:-lrkd_snuyg
# (When RUMOR_KEYWORDS are in sync)
#
# Ref:
# http://www.rubydoc.info/github/google/google-api-ruby-client/Google/Apis/CustomsearchV1/CustomsearchService#list_cses-instance_method
#
def query_google(text)
  search = Google::Apis::CustomsearchV1::CustomsearchService.new
  search.key = KEY

  begin
    result = search.list_cses cleanup(text)[0..100], cx: CX, or_terms: RUMOR_KEYWORDS.join(' '), num: 5
  rescue Google::Apis::ClientError => err
    p err
    return []
  end

  items = result.items || []

  if items.size > 0
    return ["我們的資料庫目前沒有這則訊息的紀錄。下面是從 google 搜尋的結果，給您參考 :)"].concat(items.map { |item|
      "#{item.title} #{item.snippet}\n#{item.formatted_url}"
    })
  end

  return []
end


def query_rumors_api(text)
  uri = URI("http://api.rumors.hacktabl.org/graphql")
  res = Net::HTTP.post_form(uri, query: %{
    query ($text: String) {
      Search(text: $text) {
        suggestedResult {
          __typename
          ... on Article {
            text
            replies {
              versions(limit: 0) {
                text
                reference
              }
            }
          }
          ... on Reply {
            versions(limit: 0) {
              text
              reference
            }
          }
          ... on CrawledDoc {
            rumor
            answer
            url
          }
        }
      }
    }
  }, variables: ({
    text: text
  }).to_json)

  result = (JSON.parse(res.body))['data']['Search']['suggestedResult']
  return [] unless result

  case result['__typename']
  when 'Article'
    if result['replies'].size == 0
      return [
        "之前有人有人懷疑過這則訊息的真實性，但目前還沒有人驗證過。"
      ]
    else
      reply = result['replies'][0]['versions'][0]
      return [
        "我的朋友，這則貼文含有不實資訊！",
        reply['text'],
        "資料來源：#{reply['reference']}"
      ]
    end
  when 'Reply'
    reply = result['versions'][0]
    return [
      "下面這則澄清文，似乎跟這則貼文有關，給您參考 :)",
      reply['text'],
      "資料來源：#{reply['reference']}"
    ]
  when 'CrawledDoc'
    return [
      "我們之前在網路上找到這篇文，與你的訊息有 87 分像：",
      "【#{result['rumor']}】#{result['answer']} - #{result['url']}"
    ]
  end

  return []
end

def query_newshelper(text)
  # check all URLs inside the message with news-helper

  urls = URI.extract text
  return [] unless urls.size > 0

  responses = []

  urls.each do |url|
    res = Net::HTTP.get(URI("http://newshelper.g0v.tw/index/index/?q=#{url}"))
    html = Nokogiri::HTML(res)

    # Put all results into responses[]
    #
    html.css('.table tbody tr').each do |tr|
      answerElem = tr.at_css('td:nth-child(3)')
      linkElem = tr.at_css('.manage a.btn-warning')

      responses << "#{answerElem.text} - http://newshelper.g0v.tw#{linkElem['href']}"
    end
  end

  if responses.size > 0
    responses.unshift "「新聞小幫手」有相關連結的回報唷："
  end

  return responses
end

def query text
  search_result = query_rumors_api(text)

  if search_result.length == 0
    # According to stats, min(rumor length) ~= 27 words.
    # But we should try query_rumors_api even if the text is too short.
    #
    return ["您的訊息不太像是轉傳的貼文耶⋯⋯\n要不要試試轉傳完整的訊息給我呢？"] if text.strip.size < 20

    search_result = query_newshelper(text)
  end

  return query_google(text) if search_result == 0

  search_result
end

def cleanup text
  # process to space-separated, punctuation-free single line text
  #
  text.lines.map(&:strip).join(' ').gsub(/[[:punct:]]/, ' ').gsub(/ +/, ' ')
end
