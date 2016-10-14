require 'google/apis/customsearch_v1'

CX = ENV['GSE_ID']
KEY = ENV['GSE_KEY']

RUMOR_KEYWORDS = %w{謠言 流言 傳言 假的}

# Given a message to search,
# Returns an array of search results.
#
def query(text)
  search = Google::Apis::CustomsearchV1::CustomsearchService.new
  search.key = KEY

  result = search.list_cses "#{RUMOR_KEYWORDS.join ' '} #{text}", cx: CX
  (result.items || []).select {|item|
    is_relevant(item.snippet) or is_relevant(item.title)
  }.map {|item|
    "#{item.title} #{item.snippet} #{item.formatted_url}"
  }
end

def is_relevant text
  RUMOR_KEYWORDS.any? { |keyword| text.include? keyword }
end
