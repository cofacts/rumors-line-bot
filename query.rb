require 'net/http'
require 'google/apis/customsearch_v1'
require 'json'

CX = ENV['GSE_ID']
KEY = ENV['GSE_KEY']

RUMOR_KEYWORDS = %w{謠言 流言 傳言 假的}

# Given a message to search,
# Returns an array of search results.
#
def query_google(text)
  search = Google::Apis::CustomsearchV1::CustomsearchService.new
  search.key = KEY

  result = search.list_cses "#{RUMOR_KEYWORDS.join ' '} #{cleanup(text)[0..100]}", cx: CX
  (result.items || []).select {|item|
    is_relevant(item.snippet) or is_relevant(item.title)
  }.map { |item|
    {
      title: item.title,
      snippet: item.snippet,
      url: item.formatted_url
    }
  }
end

def query_elastic_search(text)
  uri = URI("https://rumor-search.g0v.ronny.tw/query.php")
  res = Net::HTTP.post_form(uri, content: cleanup(text))
  result = JSON.parse(res.body)

  result['hits']['hits'].map do |item|
    {
      title: item['_source']['title'],
      snippet: '',
      url: item['_source']['url']
    }
  end
end

def is_relevant text
  RUMOR_KEYWORDS.any? { |keyword| text.include? keyword }
end

def cleanup text
  # process to space-separated, punctuation-free single line text
  #
  text.lines.map(&:strip).join(' ').gsub(/[[:punct:]]/, ' ').gsub(/ +/, ' ')
end
