require 'net/http'
require 'google/apis/customsearch_v1'
require 'json'

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

  (result.items || []).map { |item|
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

  p result

  return [] unless result.has_key?('hits') && result['hits'].has_key?('hits')

  result['hits']['hits'].select{ |item|
    item['_score'] > 0.1
  }.map do |item|
    {
      title: item['_source']['title'],
      snippet: '',
      url: item['_source']['url'],
      relevance: item['_score']
    }
  end
end

def query text
  search_result = query_elastic_search(text)

  if search_result.length == 0
    search_result = query_google(text)
  end

  return search_result
end

def cleanup text
  # process to space-separated, punctuation-free single line text
  #
  text.lines.map(&:strip).join(' ').gsub(/[[:punct:]]/, ' ').gsub(/ +/, ' ')
end
